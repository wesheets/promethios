#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""validate_schema_compliance.py: Validates log entries against Resurrection Codex JSON schemas."""

import argparse
import json
import os
import zipfile
import tempfile
import sys
from jsonschema import validate, exceptions as jsonschema_exceptions

# Define schema paths (these should ideally be more robustly located, e.g., relative to a Codex root env var)
CODEX_SCHEMA_DIR_DEFAULT = "/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/"

def load_schema(schema_path):
    """Loads a JSON schema from the given path."""
    if not os.path.exists(schema_path):
        print(f"Error: Schema file not found: {schema_path}", file=sys.stderr)
        return None
    try:
        with open(schema_path, 'r', encoding='utf-8') as f_schema:
            return json.load(f_schema)
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode schema JSON from {schema_path}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error loading schema {schema_path}: {e}", file=sys.stderr)
        return None

def parse_arguments():
    """Parse command-line arguments for schema validation."""
    parser = argparse.ArgumentParser(description="Promethios Log Schema Compliance Validator", formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("input_paths", nargs='+', 
                        help="Path(s) to .jsonl log file(s) or a .zip archive containing them.")
    parser.add_argument("--output-report-file", type=str, 
                        help="(Optional) Path to save the validation summary report. Defaults to stdout.")
    parser.add_argument("--codex-schema-dir", type=str, default=CODEX_SCHEMA_DIR_DEFAULT,
                        help=f"Path to the directory containing Resurrection Codex JSON schemas (default: {CODEX_SCHEMA_DIR_DEFAULT})")
    return parser.parse_args()

def determine_log_type_and_schema(log_entry, file_name, emotion_schema, justification_schema):
    """Determines log type and returns the appropriate schema."""
    # Heuristic: check for distinctive keys
    if "telemetry_data" in log_entry and "current_emotion_state" in log_entry["telemetry_data"]:
        return "emotion", emotion_schema
    if "justification_data" in log_entry and "decision_outcome" in log_entry["justification_data"]:
        return "justification", justification_schema
    
    # Fallback based on filename if entry structure is ambiguous (less reliable)
    if "emotion" in file_name.lower():
        return "emotion", emotion_schema
    if "justification" in file_name.lower():
        return "justification", justification_schema
        
    return "unknown", None

def validate_log_entry(log_entry, schema, entry_index, file_name):
    """Validates a single log entry against the given schema."""
    try:
        validate(instance=log_entry, schema=schema)
        return True, None
    except jsonschema_exceptions.ValidationError as e:
        error_summary = {
            "file": file_name,
            "line_approx": entry_index + 1, # 0-indexed to 1-indexed
            "request_id": log_entry.get("request_id", log_entry.get("justification_data", {}).get("loop_id", "N/A")),
            "error_message": e.message,
            "path": list(e.path),
            "validator": e.validator,
            "validator_value": e.validator_value
        }
        return False, error_summary
    except Exception as e:
        error_summary = {
            "file": file_name,
            "line_approx": entry_index + 1,
            "request_id": log_entry.get("request_id", "N/A"),
            "error_message": f"Unexpected validation error: {str(e)}",
        }
        return False, error_summary

def process_log_file(file_path, emotion_schema, justification_schema, report_stats):
    """Processes a single .jsonl log file for schema validation."""
    file_name = os.path.basename(file_path)
    print(f"Processing log file: {file_name}...")
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        print(f"Warning: Log file {file_name} is empty or not found. Skipping.", file=sys.stderr)
        return

    with open(file_path, 'r', encoding='utf-8') as f_log:
        for i, line in enumerate(f_log):
            try:
                log_entry = json.loads(line)
            except json.JSONDecodeError as e:
                report_stats["malformed_entries"] += 1
                report_stats["errors"].append({
                    "file": file_name,
                    "line_approx": i + 1,
                    "error_message": f"JSONDecodeError: {e}"
                })
                continue

            log_type, schema_to_use = determine_log_type_and_schema(log_entry, file_name, emotion_schema, justification_schema)

            if log_type == "unknown" or schema_to_use is None:
                report_stats["unknown_type_entries"] += 1
                report_stats["errors"].append({
                    "file": file_name,
                    "line_approx": i + 1,
                    "request_id": log_entry.get("request_id", "N/A"),
                    "error_message": "Could not determine log type or find schema."
                })
                continue
            
            report_stats[f"total_{log_type}"] += 1
            is_valid, error_detail = validate_log_entry(log_entry, schema_to_use, i, file_name)
            if is_valid:
                report_stats[f"valid_{log_type}"] += 1
            else:
                report_stats[f"invalid_{log_type}"] += 1
                if error_detail: report_stats["errors"].append(error_detail)

def generate_report(report_stats, output_file=None):
    """Generates and prints/saves the validation report."""
    report_lines = []
    report_lines.append("Promethios Log Schema Validation Report")
    report_lines.append("=" * 40)
    report_lines.append(f"Total Emotion Telemetry Entries Checked: {report_stats['total_emotion']}")
    report_lines.append(f"  Valid Emotion Telemetry Entries: {report_stats['valid_emotion']}")
    report_lines.append(f"  Invalid Emotion Telemetry Entries: {report_stats['invalid_emotion']}")
    report_lines.append("-" * 20)
    report_lines.append(f"Total Justification Log Entries Checked: {report_stats['total_justification']}")
    report_lines.append(f"  Valid Justification Log Entries: {report_stats['valid_justification']}")
    report_lines.append(f"  Invalid Justification Log Entries: {report_stats['invalid_justification']}")
    report_lines.append("-" * 20)
    report_lines.append(f"Entries with Unknown Type: {report_stats['unknown_type_entries']}")
    report_lines.append(f"Malformed JSON Entries (skipped): {report_stats['malformed_entries']}")
    report_lines.append("=" * 40)

    if report_stats["errors"]:
        report_lines.append("\nDetailed Errors:")
        for error in report_stats["errors"]:
            report_lines.append("-" * 10)
            for key, value in error.items():
                report_lines.append(f"  {key.replace('_', ' ').capitalize()}: {value}")
    else:
        report_lines.append("\nNo validation errors or malformed entries found.")
    
    report_content = "\n".join(report_lines)
    if output_file:
        try:
            with open(output_file, 'w', encoding='utf-8') as f_report:
                f_report.write(report_content)
            print(f"Validation report saved to: {output_file}")
        except IOError as e:
            print(f"Error: Could not write report to {output_file}: {e}", file=sys.stderr)
            print("\nReport Output:\n" + report_content) # Print to stdout as fallback
    else:
        print("\n" + report_content)

def validate_logs(args):
    print("Starting schema validation process...")
    emotion_schema_path = os.path.join(args.codex_schema_dir, "mgc_emotion_telemetry.schema.json")
    justification_schema_path = os.path.join(args.codex_schema_dir, "loop_justification_log.schema.v1.json")

    emotion_schema = load_schema(emotion_schema_path)
    justification_schema = load_schema(justification_schema_path)

    if not emotion_schema or not justification_schema:
        print("Error: Essential schemas could not be loaded. Aborting validation.", file=sys.stderr)
        return

    report_stats = {
        "total_emotion": 0, "valid_emotion": 0, "invalid_emotion": 0,
        "total_justification": 0, "valid_justification": 0, "invalid_justification": 0,
        "unknown_type_entries": 0, "malformed_entries": 0,
        "errors": []
    }

    files_to_process = []
    temp_dirs_to_clean = []

    for input_path in args.input_paths:
        if not os.path.exists(input_path):
            print(f"Warning: Input path not found: {input_path}. Skipping.", file=sys.stderr)
            continue
        if zipfile.is_zipfile(input_path):
            try:
                tmpdir = tempfile.mkdtemp()
                temp_dirs_to_clean.append(tmpdir)
                with zipfile.ZipFile(input_path, 'r') as zf:
                    print(f"Extracting files from ZIP: {input_path} to {tmpdir}")
                    for member in zf.namelist():
                        if member.endswith(".jsonl"):
                            zf.extract(member, tmpdir)
                            files_to_process.append(os.path.join(tmpdir, member))
            except zipfile.BadZipFile:
                print(f"Error: Could not open ZIP file {input_path}. It might be corrupted.", file=sys.stderr)
            except Exception as e:
                 print(f"Error processing ZIP file {input_path}: {e}", file=sys.stderr)
        elif input_path.endswith(".jsonl"):
            files_to_process.append(input_path)
        else:
            print(f"Warning: Skipping unsupported file type or extension: {input_path}", file=sys.stderr)

    if not files_to_process:
        print("No valid log files found to process. Aborting.", file=sys.stderr)
    else:
        for log_file_path in files_to_process:
            process_log_file(log_file_path, emotion_schema, justification_schema, report_stats)
        generate_report(report_stats, args.output_report_file)

    for tmpdir_path in temp_dirs_to_clean:
        try:
            # shutil.rmtree(tmpdir_path) # More robust cleanup
            for root, dirs, files_in_tmp in os.walk(tmpdir_path, topdown=False):
                for name in files_in_tmp: os.remove(os.path.join(root, name))
                for name in dirs: os.rmdir(os.path.join(root, name))
            os.rmdir(tmpdir_path)
        except Exception as e:
            print(f"Warning: Could not clean up temporary directory {tmpdir_path}: {e}", file=sys.stderr)
    
    print("Schema validation process finished.")

def main():
    """Main function to drive the schema validation utility."""
    args = parse_arguments()
    validate_logs(args)

if __name__ == "__main__":
    main()

