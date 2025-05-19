#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""package_logs.py: Utility to package Promethios logs for audit or review."""

import argparse
import json
import os
import datetime
import zipfile
import tempfile
import hashlib
import shutil
from collections import defaultdict

DEFAULT_EMOTION_LOG = "./logs/emotion_telemetry.log.jsonl"
DEFAULT_JUSTIFICATION_LOG = "./logs/justification.log.jsonl"
DEFAULT_OUTPUT_ZIP = "./packaged_promethios_logs_audit.zip"

# Define schema file paths and their target names in the ZIP
# These should point to the actual schema files used by the system.
# The target names are as requested by the audit.
SCHEMA_FILES_MAP = {
    "/home/ubuntu/promethios_repo/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/mgc_emotion_telemetry.schema.json": "emotion_telemetry_schema_v1.2.json",
    "/home/ubuntu/promethios_repo/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/loop_justification_log.schema.v1.json": "justification_log_schema_v1.4.json"
}

# Placeholder for component versions - this should be dynamically determined or configured
COMPONENT_VERSIONS = {
    "governance_core": "v_kernel_final_successful_test_phase2.3", 
    "runtime_executor": "v_current_repo_version_phase2.3_audit_prep"
}

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
        print(f"Error: Could not parse timestamp \t'{timestamp_str}'\t: {e}")
        return None
    except TypeError as e:
        print(f"Error: Invalid type for timestamp \t'{timestamp_str}'\t: {e}")
        return None

def parse_arguments():
    """Parse command-line arguments for log packaging."""
    parser = argparse.ArgumentParser(description="Promethios Log Packaging Utility for Audit", formatter_class=argparse.RawTextHelpFormatter)
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
    parser.add_argument("--batch-id", type=str, default=f"batch_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
                        help="Batch ID for log file naming (default: generated from current timestamp).")

    args = parser.parse_args()
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
    apply_req_id_filter = bool(target_request_ids) 

    for entry in logs:
        req_id_entry = entry.get("request_id")
        if log_type == "justification" and not req_id_entry:
             req_id_entry = entry.get("justification_data", {}).get("loop_id")
        
        if apply_req_id_filter and req_id_entry not in target_request_ids:
            continue

        ts_str = entry.get("timestamp_capture")
        if log_type == "emotion" and not ts_str:
            ts_str = entry.get("telemetry_data", {}).get("timestamp")
        elif log_type == "justification" and not ts_str:
            ts_str = entry.get("justification_data", {}).get("timestamp")
        
        ts = parse_iso_datetime(ts_str)
        if not ts: continue 

        if args.start_date and ts < args.start_date:
            continue
        if args.end_date and ts > args.end_date:
            continue
        # Add component version to each log entry if not already present
        if "component_versions" not in entry:
            entry["component_versions"] = COMPONENT_VERSIONS
        filtered.append(entry)
    return filtered

def get_sha256_hash(file_path):
    """Calculate SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def package_logs(args):
    print("Starting log packaging process for audit...")
    emotion_logs_all = load_log_file(args.emotion_log_file)
    justification_logs_all = load_log_file(args.justification_log_file)

    if emotion_logs_all is None and justification_logs_all is None:
        print("Error: Both log files failed to load or are not found. Aborting.")
        return

    loop_info = get_loop_timestamps_and_overrides(justification_logs_all or [])
    target_request_ids = set()
    has_specific_filters = any([args.request_ids, args.num_recent_loops, args.include_overrides_only])

    if args.request_ids:
        target_request_ids.update(args.request_ids.split(','))
    
    candidate_loops = []
    for req_id, info in loop_info.items():
        if args.include_overrides_only and not info["override_active"]:
            continue
        candidate_loops.append((req_id, info["min_timestamp"], info["override_active"]))

    candidate_loops.sort(key=lambda x: x[1], reverse=True)

    if args.num_recent_loops:
        selected_recent_ids = {loop[0] for loop in candidate_loops[:args.num_recent_loops]}
        if target_request_ids:
            target_request_ids.update(selected_recent_ids)
        else:
            target_request_ids = selected_recent_ids
    elif args.include_overrides_only and not args.request_ids:
        target_request_ids.update({loop[0] for loop in candidate_loops if loop[2]})
    elif not has_specific_filters and (args.start_date or args.end_date):
        target_request_ids.update(loop_info.keys())
    elif not has_specific_filters: 
        print("No specific loop filters provided. Will filter by date if specified, otherwise package all logs.")
        target_request_ids.update(loop_info.keys()) 
        if not target_request_ids and emotion_logs_all:
            for e_entry in emotion_logs_all:
                if e_entry.get("request_id"): target_request_ids.add(e_entry.get("request_id"))

    if not target_request_ids and has_specific_filters:
        print("No loops match the specific criteria. Applying date filters if specified.")
        if args.start_date or args.end_date:
            target_request_ids.update(loop_info.keys())
            if not target_request_ids and emotion_logs_all:
                for e_entry in emotion_logs_all:
                    if e_entry.get("request_id"): target_request_ids.add(e_entry.get("request_id"))
        if not target_request_ids:
            print("No loops or log entries match any specified criteria. Aborting packaging.")
            return
    elif not target_request_ids and not has_specific_filters and not (args.start_date or args.end_date):
        print("No filters specified and no loops found in justification logs. Will process all available emotion logs if any.")
        if emotion_logs_all:
             for e_entry in emotion_logs_all:
                if e_entry.get("request_id"): target_request_ids.add(e_entry.get("request_id"))
        if not target_request_ids:
            print("No logs to package. Aborting.")
            return

    print(f"Identified {len(target_request_ids)} target request IDs for packaging (or all if no specific loop filters): {', '.join(list(target_request_ids)[:5])}{'...' if len(target_request_ids) > 5 else ''}")

    filtered_emotion_logs = filter_logs(emotion_logs_all, target_request_ids, args, log_type="emotion")
    filtered_justification_logs = filter_logs(justification_logs_all, target_request_ids, args, log_type="justification")

    if not filtered_emotion_logs and not filtered_justification_logs:
        print("No log entries found matching all specified criteria after filtering. Aborting packaging.")
        return

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            logs_dir = os.path.join(tmpdir, "logs")
            schemas_dir = os.path.join(tmpdir, "schemas")
            os.makedirs(logs_dir, exist_ok=True)
            os.makedirs(schemas_dir, exist_ok=True)

            current_date_str = datetime.datetime.now().strftime("%Y-%m-%d")
            sha256_manifest_entries = []

            packaged_emotion_filename = f"emotion_telemetry_{current_date_str}_{args.batch_id}.jsonl"
            packaged_emotion_arcname = os.path.join("logs", packaged_emotion_filename)
            temp_emotion_path = os.path.join(logs_dir, packaged_emotion_filename)
            
            if filtered_emotion_logs:
                with open(temp_emotion_path, 'w', encoding='utf-8') as f_out:
                    for entry in filtered_emotion_logs:
                        f_out.write(json.dumps(entry) + '\n')
                sha256_manifest_entries.append(f"{get_sha256_hash(temp_emotion_path)}:{packaged_emotion_filename}")
                print(f"Packaged {len(filtered_emotion_logs)} emotion log entries to {packaged_emotion_filename}")
            else:
                print("No emotion log entries to package.")

            packaged_justification_filename = f"justification_logs_{current_date_str}_{args.batch_id}.jsonl"
            packaged_justification_arcname = os.path.join("logs", packaged_justification_filename)
            temp_justification_path = os.path.join(logs_dir, packaged_justification_filename)

            if filtered_justification_logs:
                with open(temp_justification_path, 'w', encoding='utf-8') as f_out:
                    for entry in filtered_justification_logs:
                        f_out.write(json.dumps(entry) + '\n')
                sha256_manifest_entries.append(f"{get_sha256_hash(temp_justification_path)}:{packaged_justification_filename}")
                print(f"Packaged {len(filtered_justification_logs)} justification log entries to {packaged_justification_filename}")
            else:
                print("No justification log entries to package.")

            # Write sha256_manifest.txt
            manifest_path = os.path.join(tmpdir, "sha256_manifest.txt")
            with open(manifest_path, 'w', encoding='utf-8') as f_manifest:
                for entry in sha256_manifest_entries:
                    f_manifest.write(entry + '\n')
            print(f"Generated sha256_manifest.txt")

            # Copy schema files
            for src_path, dest_name in SCHEMA_FILES_MAP.items():
                if os.path.exists(src_path):
                    shutil.copy(src_path, os.path.join(schemas_dir, dest_name))
                    print(f"Copied schema {dest_name}")
                else:
                    print(f"Warning: Schema file not found at {src_path}")
            
            # Add metadata.json for component versions
            metadata_path = os.path.join(tmpdir, "audit_metadata.json")
            with open(metadata_path, 'w', encoding='utf-8') as f_meta:
                json.dump({"package_generation_timestamp_utc": datetime.datetime.utcnow().isoformat() + "Z",
                             "component_versions": COMPONENT_VERSIONS,
                             "batch_id": args.batch_id,
                             "filters_applied": vars(args)
                            }, f_meta, indent=2)
            print("Generated audit_metadata.json")

            with zipfile.ZipFile(args.output_file, 'w', zipfile.ZIP_DEFLATED) as zf:
                if filtered_emotion_logs and os.path.exists(temp_emotion_path):
                    zf.write(temp_emotion_path, arcname=packaged_emotion_arcname)
                if filtered_justification_logs and os.path.exists(temp_justification_path):
                    zf.write(temp_justification_path, arcname=packaged_justification_arcname)
                
                zf.write(manifest_path, arcname="sha256_manifest.txt")
                zf.write(metadata_path, arcname="audit_metadata.json")

                for schema_file_target_name in SCHEMA_FILES_MAP.values():
                    src_schema_in_tmp = os.path.join(schemas_dir, schema_file_target_name)
                    if os.path.exists(src_schema_in_tmp):
                         zf.write(src_schema_in_tmp, arcname=os.path.join("schemas", schema_file_target_name))
            
            print(f"Successfully created audit log package: {args.output_file}")

    except Exception as e:
        print(f"An error occurred during packaging: {e}")

def main():
    """Main function to drive the log packaging utility."""
    args = parse_arguments()
    package_logs(args)

if __name__ == "__main__":
    main()

