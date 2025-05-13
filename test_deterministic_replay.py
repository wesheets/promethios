#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""test_deterministic_replay.py: Tests deterministic replay of Promethios /loop/execute endpoint."""

import argparse
import json
import os
import sys
import subprocess
import time
import shutil

# Assuming runtime_executor.py and its logs are in specific relative locations
RUNTIME_EXECUTOR_PATH = "./runtime_executor.py" # Relative to promethios_repo
LOGS_DIR = "./logs"
EMOTION_LOG_FILE = os.path.join(LOGS_DIR, "emotion_telemetry.log.jsonl")
JUSTIFICATION_LOG_FILE = os.path.join(LOGS_DIR, "justification.log.jsonl")

def parse_arguments():
    """Parse command-line arguments for deterministic replay testing."""
    parser = argparse.ArgumentParser(description="Promethios Deterministic Replay Test Harness", formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("request_payload_file", type=str,
                        help="Path to a JSON file containing the /loop/execute request payload.")
    parser.add_argument("--output-report-file", type=str,
                        help="(Optional) Path to save the replay analysis report. Defaults to stdout.")
    parser.add_argument("--kernel-path", type=str, default=os.getenv("PROMETHIOS_KERNEL_PATH", "/home/ubuntu/promethios_actual_kernel/governance_core.py"),
                        help="Path to the actual GovernanceCore kernel file to use for the test.")
    return parser.parse_args()

def clear_logs():
    """Clears existing log files."""
    print("Clearing existing log files...")
    if os.path.exists(EMOTION_LOG_FILE):
        os.remove(EMOTION_LOG_FILE)
    if os.path.exists(JUSTIFICATION_LOG_FILE):
        os.remove(JUSTIFICATION_LOG_FILE)
    # Ensure logs directory exists
    os.makedirs(LOGS_DIR, exist_ok=True)

def run_executor(payload_file, kernel_path, run_number):
    """Runs the runtime_executor.py with the given payload and kernel."""
    print(f"Executing Run {run_number} with payload {payload_file} and kernel {kernel_path}...")
    env = os.environ.copy()
    env["PROMETHIOS_KERNEL_PATH"] = kernel_path
    # The runtime_executor.py is expected to take the payload file as a command-line argument
    # This needs to be confirmed or adjusted based on runtime_executor.py actual interface
    # For now, assuming it reads a hardcoded payload or needs modification to accept one.
    # As runtime_executor.py currently uses a hardcoded payload, we will execute it directly.
    # If it were to accept a payload file: cmd = ["python3.11", RUNTIME_EXECUTOR_PATH, payload_file]
    cmd = ["python3.11", RUNTIME_EXECUTOR_PATH]
    try:
        process = subprocess.Popen(cmd, env=env, cwd=os.path.dirname(RUNTIME_EXECUTOR_PATH) or ".", stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate(timeout=60) # Added timeout
        if process.returncode != 0:
            print(f"Error during Run {run_number} execution:", file=sys.stderr)
            print(f"Stdout:\n{stdout.decode(errors=	"ignore	")}", file=sys.stderr)
            print(f"Stderr:\n{stderr.decode(errors=	"ignore	")}", file=sys.stderr)
            return False
        print(f"Run {run_number} completed.")
        # Add a small delay to ensure logs are flushed
        time.sleep(2)
        return True
    except subprocess.TimeoutExpired:
        print(f"Error: Run {run_number} timed out.", file=sys.stderr)
        process.kill()
        stdout, stderr = process.communicate()
        print(f"Stdout (timeout):\n{stdout.decode(errors=	"ignore	")}", file=sys.stderr)
        print(f"Stderr (timeout):\n{stderr.decode(errors=	"ignore	")}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Exception during Run {run_number}: {e}", file=sys.stderr)
        return False

def collect_log_hashes(log_file_path):
    """Collects entry_sha256_hash from a log file."""
    hashes = []
    if not os.path.exists(log_file_path):
        print(f"Warning: Log file not found for hash collection: {log_file_path}", file=sys.stderr)
        return hashes
    try:
        with open(log_file_path, "r", encoding="utf-8") as f_log:
            for line in f_log:
                try:
                    log_entry = json.loads(line)
                    # Check top level, then within justification_data or telemetry_data for the hash
                    entry_hash = log_entry.get("entry_sha256_hash") or \
                                 log_entry.get("justification_data", {}).get("entry_sha256_hash") or \
                                 log_entry.get("telemetry_data", {}).get("entry_sha256_hash")
                    if entry_hash:
                        hashes.append(entry_hash)
                    else:
                        print(f"Warning: No entry_sha256_hash found in log entry: {line.strip()}", file=sys.stderr)
                except json.JSONDecodeError:
                    print(f"Warning: Skipping malformed JSON line in {log_file_path}: {line.strip()}", file=sys.stderr)
    except Exception as e:
        print(f"Error collecting hashes from {log_file_path}: {e}", file=sys.stderr)
    return hashes

def run_replay_test(args):
    report_lines = ["Promethios Deterministic Replay Test Report"]
    report_lines.append("=" * 50)
    report_lines.append(f"Timestamp: {datetime.datetime.utcnow().isoformat()}Z")
    report_lines.append(f"Request Payload File: {args.request_payload_file}")
    report_lines.append(f"Using Kernel: {args.kernel_path}")
    report_lines.append("-" * 20)

    if not os.path.exists(args.request_payload_file):
        error_msg = f"Error: Request payload file not found: {args.request_payload_file}"
        print(error_msg, file=sys.stderr)
        report_lines.append(error_msg)
        report_lines.append("Test Result: FAILED (Setup Error)")
        generate_report_output(report_lines, args.output_report_file)
        return

    if not os.path.exists(args.kernel_path):
        error_msg = f"Error: Kernel file not found: {args.kernel_path}. Please set PROMETHIOS_KERNEL_PATH or use --kernel-path."
        print(error_msg, file=sys.stderr)
        report_lines.append(error_msg)
        report_lines.append("Test Result: FAILED (Setup Error)")
        generate_report_output(report_lines, args.output_report_file)
        return

    # Run 1
    report_lines.append("Executing Run 1...")
    clear_logs()
    if not run_executor(args.request_payload_file, args.kernel_path, 1):
        report_lines.append("Run 1 execution failed.")
        report_lines.append("Test Result: FAILED (Execution Error)")
        generate_report_output(report_lines, args.output_report_file)
        return
    
    emotion_hashes_run1 = collect_log_hashes(EMOTION_LOG_FILE)
    justification_hashes_run1 = collect_log_hashes(JUSTIFICATION_LOG_FILE)
    report_lines.append(f"Run 1 Emotion Log Hashes ({len(emotion_hashes_run1)}): {emotion_hashes_run1}")
    report_lines.append(f"Run 1 Justification Log Hashes ({len(justification_hashes_run1)}): {justification_hashes_run1}")

    # Run 2
    report_lines.append("\nExecuting Run 2...")
    clear_logs()
    if not run_executor(args.request_payload_file, args.kernel_path, 2):
        report_lines.append("Run 2 execution failed.")
        report_lines.append("Test Result: FAILED (Execution Error)")
        generate_report_output(report_lines, args.output_report_file)
        return

    emotion_hashes_run2 = collect_log_hashes(EMOTION_LOG_FILE)
    justification_hashes_run2 = collect_log_hashes(JUSTIFICATION_LOG_FILE)
    report_lines.append(f"Run 2 Emotion Log Hashes ({len(emotion_hashes_run2)}): {emotion_hashes_run2}")
    report_lines.append(f"Run 2 Justification Log Hashes ({len(justification_hashes_run2)}): {justification_hashes_run2}")

    # Comparison
    report_lines.append("\nComparison Results:")
    emotion_match = emotion_hashes_run1 == emotion_hashes_run2
    justification_match = justification_hashes_run1 == justification_hashes_run2

    report_lines.append(f"  Emotion Log Hashes Match: {emotion_match}")
    if not emotion_match:
        report_lines.append(f"    Run 1 Emotion Hashes: {emotion_hashes_run1}")
        report_lines.append(f"    Run 2 Emotion Hashes: {emotion_hashes_run2}")
    report_lines.append(f"  Justification Log Hashes Match: {justification_match}")
    if not justification_match:
        report_lines.append(f"    Run 1 Justification Hashes: {justification_hashes_run1}")
        report_lines.append(f"    Run 2 Justification Hashes: {justification_hashes_run2}")

    if emotion_match and justification_match:
        report_lines.append("\nTest Result: PASSED - Deterministic Replay Confirmed")
    else:
        report_lines.append("\nTest Result: FAILED - Deterministic Replay NOT Confirmed")
    
    generate_report_output(report_lines, args.output_report_file)
    print("Deterministic replay test finished.")

def generate_report_output(report_lines, output_file_path):
    report_content = "\n".join(report_lines)
    if output_file_path:
        try:
            with open(output_file_path, "w", encoding="utf-8") as f_report:
                f_report.write(report_content)
            print(f"Replay test report saved to: {output_file_path}")
        except IOError as e:
            print(f"Error: Could not write report to {output_file_path}: {e}", file=sys.stderr)
            print("\nReport Output:\n" + report_content) # Fallback
    else:
        print("\n" + report_content)

def main():
    """Main function to drive the deterministic replay test harness."""
    args = parse_arguments()
    # Create a dummy payload file for testing if it doesn't exist
    # This is because runtime_executor.py does not currently accept a payload file argument
    # and uses its own internal payload. The harness still needs a file for its own arg parsing.
    if not os.path.exists(args.request_payload_file):
        print(f"Warning: Payload file {args.request_payload_file} not found. Creating a dummy one for harness execution.", file=sys.stderr)
        try:
            with open(args.request_payload_file, "w", encoding="utf-8") as pf:
                json.dump({"note": "This is a dummy payload for test_deterministic_replay.py as runtime_executor.py uses an internal payload."}, pf)
        except IOError as e:
            print(f"Error: Could not create dummy payload file {args.request_payload_file}: {e}. Please create it manually.", file=sys.stderr)
            return
            
    run_replay_test(args)

if __name__ == "__main__":
    main()

