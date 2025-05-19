#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""view_logs.py: CLI tool for Promethios log observability."""

import argparse
import json
import os
import datetime
from collections import defaultdict

DEFAULT_EMOTION_LOG = "./logs/emotion_telemetry.log.jsonl"
DEFAULT_JUSTIFICATION_LOG = "./logs/justification.log.jsonl"

def parse_iso_datetime(timestamp_str):
    """Parse ISO 8601 timestamp string, handling potential timezone variations."""
    if not timestamp_str: 
        return None
    try:
        if isinstance(timestamp_str, datetime.datetime):
            return timestamp_str # Already a datetime object
        if timestamp_str.endswith("Z"):
            timestamp_str = timestamp_str[:-1] + "+00:00"
        dt = datetime.datetime.fromisoformat(timestamp_str)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=datetime.timezone.utc) # Assume UTC if no timezone
        return dt
    except ValueError as e:
        print(f"Warning: Could not parse timestamp 	'{timestamp_str}	': {e}")
        return None
    except TypeError as e:
        print(f"Warning: Invalid type for timestamp 	'{timestamp_str}	': {e}")
        return None

def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Promethios Log Viewer CLI Tool", formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("--emotion-log-file", type=str, default=DEFAULT_EMOTION_LOG,
                        help=f"Path to the emotion telemetry log file (default: {DEFAULT_EMOTION_LOG})")
    parser.add_argument("--justification-log-file", type=str, default=DEFAULT_JUSTIFICATION_LOG,
                        help=f"Path to the justification log file (default: {DEFAULT_JUSTIFICATION_LOG})")

    subparsers = parser.add_subparsers(dest="command", title="commands",
                                       description="Valid commands to interact with logs. Use [command] -h for details.",
                                       help="Available commands")
    subparsers.required = True

    # Command: list_loops / recent
    parser_list_loops = subparsers.add_parser("list_loops", aliases=["recent"],
                                              help="Display a summary of recent loop executions.",
                                              formatter_class=argparse.RawTextHelpFormatter)
    parser_list_loops.add_argument("count", type=int, nargs="?", default=10,
                                   help="Number of recent loop executions to display (default: 10)")
    parser_list_loops.add_argument("--start-date", type=parse_iso_datetime, help="Start timestamp (UTC) YYYY-MM-DDTHH:MM:SSZ")
    parser_list_loops.add_argument("--end-date", type=parse_iso_datetime, help="End timestamp (UTC) YYYY-MM-DDTHH:MM:SSZ")
    parser_list_loops.set_defaults(func=handle_list_loops)

    # Command: get_loop
    parser_get_loop = subparsers.add_parser("get_loop", help="Display detailed logs for a specific request_id.",
                                            formatter_class=argparse.RawTextHelpFormatter)
    parser_get_loop.add_argument("request_id", type=str, help="The request_id of the loop to retrieve.")
    parser_get_loop.set_defaults(func=handle_get_loop)

    # Command: find_overrides
    parser_find_overrides = subparsers.add_parser("find_overrides", 
                                                help="List loop executions where an operator override was active.",
                                                formatter_class=argparse.RawTextHelpFormatter)
    parser_find_overrides.add_argument("--start-date", type=parse_iso_datetime, help="Start timestamp (UTC) YYYY-MM-DDTHH:MM:SSZ")
    parser_find_overrides.add_argument("--end-date", type=parse_iso_datetime, help="End timestamp (UTC) YYYY-MM-DDTHH:MM:SSZ")
    parser_find_overrides.set_defaults(func=handle_find_overrides)
    
    # Command: query_logs
    parser_query_logs = subparsers.add_parser("query_logs", help="Advanced query for log entries.",
                                              formatter_class=argparse.RawTextHelpFormatter)
    parser_query_logs.add_argument("--request-id", type=str, help="Filter by request_id.")
    parser_query_logs.add_argument("--start-date", type=parse_iso_datetime, help="Start timestamp (UTC) YYYY-MM-DDTHH:MM:SSZ")
    parser_query_logs.add_argument("--end-date", type=parse_iso_datetime, help="End timestamp (UTC) YYYY-MM-DDTHH:MM:SSZ")
    parser_query_logs.add_argument("--override-active", type=lambda x: (str(x).lower() == 'true'), 
                                   choices=[True, False], help="Filter by override active status (true/false).")
    parser_query_logs.add_argument("--log-type", type=str, choices=["emotion", "justification", "all"], 
                                   default="all", help="Specify log type to query (default: all).")
    parser_query_logs.add_argument("--emotion-state", type=str, help="(Optional) Filter emotion logs by specific current_emotion_state.")
    parser_query_logs.add_argument("--search-term", type=str, help="(Optional) Case-insensitive keyword search in the JSON content of log entries.")
    parser_query_logs.set_defaults(func=handle_query_logs)

    return parser.parse_args()

def load_log_file(file_path):
    """Load a .jsonl log file into a list of dictionaries."""
    if not os.path.exists(file_path):
        print(f"Error: Log file not found: {file_path}")
        return None # Indicate error
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
        return None # Indicate error

def get_loop_summary_data(emotion_logs, justification_logs):
    """Combines emotion and justification logs to create loop summaries."""
    loop_data = defaultdict(lambda: {"request_id": None, "timestamps": [], "status": "UNKNOWN", "emotion_states": [], "override_active": False})

    if justification_logs:
        for entry in justification_logs:
            # Prioritize request_id from the outer structure (runtime_executor.py logs)
            # Fallback to loop_id within justification_data (kernel direct logs)
            req_id = entry.get("request_id") or entry.get("justification_data", {}).get("loop_id")
            if not req_id: continue
            loop_data[req_id]["request_id"] = req_id
            
            ts_str = entry.get("timestamp_capture") or entry.get("justification_data", {}).get("timestamp")
            ts = parse_iso_datetime(ts_str)
            if ts: loop_data[req_id]["timestamps"].append(ts)

            j_data = entry.get("justification_data", {})
            loop_data[req_id]["status"] = j_data.get("decision_outcome", loop_data[req_id]["status"])
            if j_data.get("override_signal_received") or j_data.get("override_active") or j_data.get("override_required"):
                loop_data[req_id]["override_active"] = True

    if emotion_logs:
        for entry in emotion_logs:
            req_id = entry.get("request_id")
            if not req_id: continue
            loop_data[req_id]["request_id"] = req_id 

            ts_str = entry.get("timestamp_capture") or entry.get("telemetry_data", {}).get("timestamp")
            ts = parse_iso_datetime(ts_str)
            if ts: loop_data[req_id]["timestamps"].append(ts)
            
            e_data = entry.get("telemetry_data", {})
            current_emotion = e_data.get("current_emotion_state")
            if current_emotion: loop_data[req_id]["emotion_states"].append(current_emotion)

    summaries = []
    for req_id, data in loop_data.items():
        if not data["timestamps"]:
            main_ts = datetime.datetime.min.replace(tzinfo=datetime.timezone.utc) 
        else:
            main_ts = min(data["timestamps"]) 
        
        primary_emotion = data["emotion_states"][-1] if data["emotion_states"] else "N/A"
        summaries.append({
            "request_id": req_id,
            "timestamp": main_ts,
            "status": data["status"],
            "primary_emotion": primary_emotion,
            "override_active": data["override_active"]
        })
    
    summaries.sort(key=lambda x: x["timestamp"], reverse=True)
    return summaries

def handle_list_loops(args):
    print(f"Listing recent loops (up to {args.count})...")
    if args.start_date: print(f"Filtering from start date: {args.start_date.isoformat()}")
    if args.end_date: print(f"Filtering until end date: {args.end_date.isoformat()}")

    emotion_logs = load_log_file(args.emotion_log_file)
    justification_logs = load_log_file(args.justification_log_file)

    if emotion_logs is None or justification_logs is None: # Error occurred during loading
        return 
    if not emotion_logs and not justification_logs:
        print("No log data found to process.")
        return

    loop_summaries = get_loop_summary_data(emotion_logs or [], justification_logs or [])

    filtered_summaries = []
    for summary in loop_summaries:
        if args.start_date and summary["timestamp"] < args.start_date:
            continue
        if args.end_date and summary["timestamp"] > args.end_date:
            continue
        filtered_summaries.append(summary)

    if not filtered_summaries:
        print("No loops found matching the criteria.")
        return

    print(f"\nDisplaying up to {min(args.count, len(filtered_summaries))} most recent loop executions:")
    print("-" * 100)
    print(f"{	'Timestamp':<28} {	'Request ID':<38} {	'Status':<15} {	'Emotion':<15} {	'Override'}")
    print("-" * 100)
    for i, summary in enumerate(filtered_summaries[:args.count]):
        ts_display = summary["timestamp"].isoformat() if summary["timestamp"] != datetime.datetime.min.replace(tzinfo=datetime.timezone.utc) else "N/A                        "
        print(f"{ts_display:<28} {summary['request_id']:<38} {summary['status']:<15} {summary['primary_emotion']:<15} {summary['override_active']}")
    print("-" * 100)

def handle_get_loop(args):
    print(f"Getting details for loop with request_id: {args.request_id}...")
    emotion_logs = load_log_file(args.emotion_log_file)
    justification_logs = load_log_file(args.justification_log_file)

    if emotion_logs is None or justification_logs is None: return

    found_emotion = False
    print("\n--- Emotion Telemetry ---")
    if emotion_logs:
        for entry in emotion_logs:
            if entry.get("request_id") == args.request_id:
                print(json.dumps(entry, indent=2))
                found_emotion = True
    if not found_emotion:
        print(f"No emotion telemetry found for request_id: {args.request_id}")

    found_justification = False
    print("\n--- Justification Log ---")
    if justification_logs:
        for entry in justification_logs:
            j_data = entry.get("justification_data", {})
            entry_req_id = entry.get("request_id") or j_data.get("loop_id")
            if entry_req_id == args.request_id:
                print(json.dumps(entry, indent=2))
                found_justification = True
    if not found_justification:
        print(f"No justification log found for request_id: {args.request_id}")

def handle_find_overrides(args):
    print(f"Finding loops with active overrides...")
    if args.start_date: print(f"Filtering from start date: {args.start_date.isoformat()}")
    if args.end_date: print(f"Filtering until end date: {args.end_date.isoformat()}")

    justification_logs = load_log_file(args.justification_log_file)
    if justification_logs is None: return
    if not justification_logs:
        print("No justification log data found to process.")
        return

    override_loops = []
    for entry in justification_logs:
        j_data = entry.get("justification_data", {})
        is_override = j_data.get("override_signal_received") or \
                        j_data.get("override_active") or \
                        j_data.get("override_required")
        
        if is_override:
            ts_str = entry.get("timestamp_capture") or j_data.get("timestamp")
            ts = parse_iso_datetime(ts_str)
            if not ts: continue 

            if args.start_date and ts < args.start_date:
                continue
            if args.end_date and ts > args.end_date:
                continue
            
            req_id = entry.get("request_id") or j_data.get("loop_id")
            override_loops.append({"request_id": req_id, "timestamp": ts, "details": j_data})

    if not override_loops:
        print("No loops found with active overrides matching the criteria.")
        return

    override_loops.sort(key=lambda x: x["timestamp"], reverse=True)
    print(f"\nFound {len(override_loops)} loop(s) with active overrides:")
    print("-" * 100)
    print(f"{	'Timestamp':<28} {	'Request ID':<38} {	'Override Type'}")
    print("-" * 100)
    for loop in override_loops:
        override_type = loop["details"].get("override_details", {}).get("override_type") or \
                        loop["details"].get("override_type") or "N/A"
        ts_display = loop["timestamp"].isoformat() if loop["timestamp"] else "N/A                        "
        print(f"{ts_display:<28} {loop['request_id']:<38} {override_type}")
    print("-" * 100)

def handle_query_logs(args):
    print(f"Querying logs with advanced filters...")
    # (Details of applied filters will be shown by argparse help)

    emotion_data = []
    justification_data = []

    if args.log_type in ["emotion", "all"]:
        loaded_e = load_log_file(args.emotion_log_file)
        if loaded_e is None: return
        emotion_data = loaded_e
    if args.log_type in ["justification", "all"]:
        loaded_j = load_log_file(args.justification_log_file)
        if loaded_j is None: return
        justification_data = loaded_j

    if not emotion_data and not justification_data:
        print("No log data found to process based on current log files and log_type filter.")
        return

    results = []
    search_term_lower = args.search_term.lower() if args.search_term else None

    if args.log_type in ["emotion", "all"]:
        for entry in emotion_data:
            e_data = entry.get("telemetry_data", {})
            ts_str = entry.get("timestamp_capture") or e_data.get("timestamp")
            ts = parse_iso_datetime(ts_str)
            if not ts: continue

            if args.request_id and entry.get("request_id") != args.request_id: continue
            if args.start_date and ts < args.start_date: continue
            if args.end_date and ts > args.end_date: continue
            if args.emotion_state and e_data.get("current_emotion_state") != args.emotion_state: continue
            if search_term_lower and search_term_lower not in json.dumps(entry).lower(): continue
            results.append({"type": "emotion", "timestamp": ts, "data": entry})

    if args.log_type in ["justification", "all"]:
        for entry in justification_data:
            j_data = entry.get("justification_data", {})
            ts_str = entry.get("timestamp_capture") or j_data.get("timestamp")
            ts = parse_iso_datetime(ts_str)
            if not ts: continue
            
            entry_req_id = entry.get("request_id") or j_data.get("loop_id")

            if args.request_id and entry_req_id != args.request_id: continue
            if args.start_date and ts < args.start_date: continue
            if args.end_date and ts > args.end_date: continue
            
            is_override = j_data.get("override_signal_received") or \
                            j_data.get("override_active") or \
                            j_data.get("override_required")
            if args.override_active is not None and is_override != args.override_active: continue
            if search_term_lower and search_term_lower not in json.dumps(entry).lower(): continue
            results.append({"type": "justification", "timestamp": ts, "data": entry})
    
    results.sort(key=lambda x: x["timestamp"], reverse=False) 

    if not results:
        print("No log entries found matching the specified criteria.")
        return

    print(f"\nFound {len(results)} log entries matching criteria (chronological order):")
    for res in results:
        print("-" * 60)
        print(f"Type: {res['type'].capitalize()} | Timestamp: {res['timestamp'].isoformat()} | Request ID: {res['data'].get('request_id', 'N/A')}")
        print(json.dumps(res['data'], indent=2))
    print("-" * 60)

def main():
    """Main function to drive the CLI tool."""
    args = parse_arguments()
    try:
        if hasattr(args, 'func'):
            args.func(args)
        else:
            # This should not be reached if subparsers.required = True and a default func is not set on main parser
            args.parser.print_help() # Show help if no command given (though argparse handles this)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        # Consider adding more detailed error logging or traceback for debugging if needed

if __name__ == "__main__":
    main()

