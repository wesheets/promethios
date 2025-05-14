import json
import hashlib
import argparse
import os

def canonical_json_string(data: dict) -> str:
    """Generates a canonical string representation of a JSON object for hashing."""
    return json.dumps(data, sort_keys=True, separators=(',', ':'))

def calculate_sha256_hash(text: str) -> str:
    """Calculates SHA256 hash of a string."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def verify_log_file_hashes(log_file_path: str):
    """Verifies SHA256 hashes for each entry in a given JSON Lines log file."""
    if not os.path.exists(log_file_path):
        print(f"Error: Log file not found at {log_file_path}")
        return

    total_entries = 0
    valid_hashes = 0
    invalid_hashes = 0
    invalid_entries_details = []

    print(f"Verifying hashes in log file: {log_file_path}...")

    with open(log_file_path, 'r') as f:
        for line_number, line in enumerate(f, 1):
            total_entries += 1
            try:
                log_entry = json.loads(line.strip())
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON on line {line_number}: {e}")
                invalid_hashes += 1
                invalid_entries_details.append({"line": line_number, "error": "JSONDecodeError", "details": str(e)})
                continue

            if "entry_sha256_hash" not in log_entry:
                print(f"Warning: Missing 'entry_sha256_hash' on line {line_number}. Skipping hash verification for this entry.")
                # Or consider this an invalid entry depending on strictness
                # invalid_hashes += 1
                # invalid_entries_details.append({"line": line_number, "error": "MissingHashField", "request_id": log_entry.get("request_id")})
                continue

            stored_hash = log_entry.pop("entry_sha256_hash") # Remove hash field for recalculation
            
            # The rest of the log_entry is what was originally hashed
            content_to_hash = log_entry 
            
            try:
                canonical_string = canonical_json_string(content_to_hash)
                recalculated_hash = calculate_sha256_hash(canonical_string)

                if recalculated_hash == stored_hash:
                    valid_hashes += 1
                else:
                    invalid_hashes += 1
                    invalid_entries_details.append({
                        "line": line_number, 
                        "request_id": log_entry.get("request_id"),
                        "stored_hash": stored_hash,
                        "recalculated_hash": recalculated_hash
                    })
            except Exception as e:
                print(f"Error during hash calculation/comparison on line {line_number}: {e}")
                invalid_hashes += 1
                invalid_entries_details.append({"line": line_number, "error": "HashCalculationError", "details": str(e)})

    print("\n--- Hash Verification Summary ---")
    print(f"Log File: {log_file_path}")
    print(f"Total Entries Checked: {total_entries}")
    print(f"Valid Hashes: {valid_hashes}")
    print(f"Invalid Hashes: {invalid_hashes}")

    if invalid_entries_details:
        print("\n--- Details of Invalid Entries ---")
        for detail in invalid_entries_details:
            print(json.dumps(detail))
    
    if total_entries > 0 and invalid_hashes == 0:
        print("\nAll entries verified successfully!")
    elif total_entries == 0:
        print("\nLog file is empty or contains no processable entries.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify SHA256 hashes in Promethios log files.")
    parser.add_argument("log_file", help="Path to the .jsonl log file to verify (e.g., emotion_telemetry.log.jsonl or justification.log.jsonl)")
    
    args = parser.parse_args()
    
    verify_log_file_hashes(args.log_file)

