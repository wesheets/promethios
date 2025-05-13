#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""package_logs.py: Utility to package Promethios logs for audit or review."""

import argparse
import json
import os
import datetime
import zipfile
import tempfile
from collections import defaultdict

DEFAULT_EMOTION_LOG = "./logs/emotion_telemetry.log.jsonl"
DEFAULT_JUSTIFICATION_LOG = "./logs/justification.log.jsonl"
DEFAULT_OUTPUT_ZIP = "./packaged_promethios_logs.zip"

def parse_iso_datetime(timestamp_str):
    """Parse ISO 8601 timestamp string, handling potential timezone variations."""
    if not timestamp_str:
        return None
    try:
        if isinstance(timestamp_str, datetime.datetime):
            return timestamp_str
        if timestamp_str.endswith("Z"):
            timestamp_str = timestamp_str[:-1] + "+00:00"
        dt = datetime.datetime.fromisoformat(timestamp_str)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=datetime.timezone.utc)
        return dt
    except ValueError as e:
        print(f"Error: Could not parse timestamp 	'{timestamp_str}'	: {e}")
        return None
    except TypeError as e:
        print(f"Error: Invalid type for timestamp 	'{timestamp_str}'	: {e}")
        return None

def parse_arguments():
    """Parse command-line arguments for log packaging."""
    parser = argparse.ArgumentParser(description="Promethios Log Packaging Utility", formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("--request-ids", type=str, help="Comma-separated list of request_ids to include.")
    parser.add_argument("--start-date", type=parse_iso_datetime, help="Start timestamp (UTC) YYYY-MM-DDTHH:MM:SSZ (inclusive).")
    parser.add_argument("--end-date", type=parse_iso_datetime, help="End timestamp (UTC) YYYY-MM-DDTHH:MM:SSZ (inclusive).")
    parser.add_argument("--num-recent-loops", type=int, help="Package logs for the N most recent loop executions.")
    parser.add_argument("--include-overrides-only", action="store_true", help="Only include logs from loops where an operator override was active.")
    parser.add_argument("--output-file", type=str, default=DEFAULT_OUTPUT_ZIP,
                        help=f"Path to the output ZIP archive (default: {DEFAULT_OUTPUT_ZIP})")
    parser.add_argument("--emotion-log-file", type=str, default=DEFAULT_EMOTION_LOG,
                        help=f"Path to the source emotion telemetry log file (default: {DEFAULT_EMOTION_LOG})")
    parser.add_argument("--justification-log-file", type=str, default=DEFAULT_JUSTIFICATION_LOG,
                        help=f"Path to the source justification log file (default: {DEFAULT_JUSTIFICATION_LOG})")

    args = parser.parse_args()
    if not any([args.request_ids, args.start_date, args.end_date, args.num_recent_loops, args.include_overrides_only]):
        parser.error("At least one filtering criterion (--request-ids, --start-date, --end-date, --num-recent-loops, --include-overrides-only) must be provided.")
    return args

def load_log_file(file_path):
    """Load a .jsonl log file into a list of dictionaries."""
    if not os.path.exists(file_path):
        print(f"Error: Log file not found: {file_path}")
        return None
    if os.path.getsize(file_path) == 0:
        print(f"Info: Log file is empty: {file_path}")
        return []
    entries = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"Warning: Skipping malformed line {i+1} in {file_path}: {e} - Line: {line.strip()}")
        return entries
    except Exception as e:
        print(f"Error reading log file {file_path}: {e}")
        return None

def get_loop_timestamps_and_overrides(justification_logs):
    """Extracts timestamps and override status for each loop from justification logs."""
    loop_info = defaultdict(lambda: {"timestamps": [], "override_active": False, "min_timestamp": datetime.datetime.max.replace(tzinfo=datetime.timezone.utc)})
    if not justification_logs: return {}
    for entry in justification_logs:
        req_id = entry.get("request_id") or entry.get("justification_data", {}).get("loop_id")
        if not req_id: continue
        ts_str = entry.get("timestamp_capture") or entry.get("justification_data", {}).get("timestamp")
        ts = parse_iso_datetime(ts_str)
        if ts:
            loop_info[req_id]["timestamps"].append(ts)
            loop_info[req_id]["min_timestamp"] = min(loop_info[req_id]["min_timestamp"], ts)
        j_data = entry.get("justification_data", {})
        if j_data.get("override_signal_received") or j_data.get("override_active") or j_data.get("override_required"):
            loop_info[req_id]["override_active"] = True
    return loop_info

def filter_logs(logs, target_request_ids, args, log_type="unknown"):
    """Filters logs based on target request_ids and date ranges."""
    if logs is None: return []
    filtered = []
    for entry in logs:
        req_id_entry = entry.get("request_id")
        if log_type == "justification" and not req_id_entry:
             req_id_entry = entry.get("justification_data", {}).get("loop_id")
        
        if req_id_entry not in target_request_ids:
            continue

        ts_str = entry.get("timestamp_capture")
        if log_type == "emotion" and not ts_str:
            ts_str = entry.get("telemetry_data", {}).get("timestamp")
        elif log_type == "justification" and not ts_str:
            ts_str = entry.get("justification_data", {}).get("timestamp")
        
        ts = parse_iso_datetime(ts_str)
        if not ts: continue # Skip if no valid timestamp

        if args.start_date and ts < args.start_date:
            continue
        if args.end_date and ts > args.end_date:
            continue
        filtered.append(entry)
    return filtered

def package_logs(args):
    print("Starting log packaging process...")
    emotion_logs_all = load_log_file(args.emotion_log_file)
    justification_logs_all = load_log_file(args.justification_log_file)

    if emotion_logs_all is None and justification_logs_all is None:
        print("Error: Both log files failed to load or are not found. Aborting.")
        return

    loop_info = get_loop_timestamps_and_overrides(justification_logs_all or [])
    target_request_ids = set()

    if args.request_ids:
        target_request_ids.update(args.request_ids.split(','))
    
    # Determine target_request_ids based on other criteria
    candidate_loops = []
    for req_id, info in loop_info.items():
        if args.include_overrides_only and not info["override_active"]:
            continue
        # Date filtering for loops is implicitly handled by filtering individual log entries later
        # but we can pre-filter loops if num_recent_loops is used
        candidate_loops.append((req_id, info["min_timestamp"], info["override_active"]))

    # Sort by timestamp for num_recent_loops
    candidate_loops.sort(key=lambda x: x[1], reverse=True)

    if args.num_recent_loops:
        selected_recent_ids = {loop[0] for loop in candidate_loops[:args.num_recent_loops]}
        if target_request_ids: # If request_ids were also specified, take intersection or union based on desired logic. Here, we assume union.
            target_request_ids.update(selected_recent_ids)
        else:
            target_request_ids = selected_recent_ids
    elif args.include_overrides_only and not args.request_ids: # if only overrides_only is set
        target_request_ids.update({loop[0] for loop in candidate_loops if loop[2]})
    elif not target_request_ids and (args.start_date or args.end_date): # if only date range is set, all loops are candidates initially
        target_request_ids.update(loop_info.keys())

    if not target_request_ids:
        print("No loops match the initial criteria (request_ids, num_recent_loops, include_overrides_only). Applying date filters to all logs if specified.")
        # If no specific loops targeted by ID/recent/override, but date range is given, all loops are candidates for date filtering
        if args.start_date or args.end_date:
             target_request_ids.update(loop_info.keys())
             if not target_request_ids and (emotion_logs_all or justification_logs_all): # If no justification logs, but emotion logs exist
                 if emotion_logs_all:
                     for e_entry in emotion_logs_all:
                         if e_entry.get("request_id"): target_request_ids.add(e_entry.get("request_id"))
        if not target_request_ids:
            print("No loops or log entries match any specified criteria. Aborting packaging.")
            return

    print(f"Identified {len(target_request_ids)} target request IDs for packaging: {', '.join(list(target_request_ids)[:5])}{'...' if len(target_request_ids) > 5 else ''}")

    filtered_emotion_logs = filter_logs(emotion_logs_all, target_request_ids, args, log_type="emotion")
    filtered_justification_logs = filter_logs(justification_logs_all, target_request_ids, args, log_type="justification")

    if not filtered_emotion_logs and not filtered_justification_logs:
        print("No log entries found matching all specified criteria after filtering. Aborting packaging.")
        return

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            packaged_emotion_path = os.path.join(tmpdir, "packaged_emotion_telemetry.log.jsonl")
            packaged_justification_path = os.path.join(tmpdir, "packaged_justification.log.jsonl")
            
            if filtered_emotion_logs:
                with open(packaged_emotion_path, 'w', encoding='utf-8') as f_out:
                    for entry in filtered_emotion_logs:
                        f_out.write(json.dumps(entry) + '\n')
                print(f"Packaged {len(filtered_emotion_logs)} emotion log entries.")
            else:
                print("No emotion log entries to package.")

            if filtered_justification_logs:
                with open(packaged_justification_path, 'w', encoding='utf-8') as f_out:
                    for entry in filtered_justification_logs:
                        f_out.write(json.dumps(entry) + '\n')
                print(f"Packaged {len(filtered_justification_logs)} justification log entries.")
            else:
                print("No justification log entries to package.")

            with zipfile.ZipFile(args.output_file, 'w', zipfile.ZIP_DEFLATED) as zf:
                if filtered_emotion_logs and os.path.exists(packaged_emotion_path):
                    zf.write(packaged_emotion_path, arcname="packaged_emotion_telemetry.log.jsonl")
                if filtered_justification_logs and os.path.exists(packaged_justification_path):
                    zf.write(packaged_justification_path, arcname="packaged_justification.log.jsonl")
            
            print(f"Successfully created log package: {args.output_file}")

    except Exception as e:
        print(f"An error occurred during packaging: {e}")

def main():
    """Main function to drive the log packaging utility."""
    args = parse_arguments()
    package_logs(args)

if __name__ == "__main__":
    main()

