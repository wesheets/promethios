# /home/ubuntu/promethios_repo/promethios_ui_surface/src/utils/log_parser.py

import json
import os
import hashlib

def parse_jsonl_log(file_path):
    """Reads and parses a .jsonl log file.

    Args:
        file_path (str): The absolute path to the .jsonl log file.

    Returns:
        list: A list of log entries, where each entry is a dictionary.
              Each entry includes its original line number (1-based) as '_line_number'
              and its sha256 hash as 'entry_sha256_hash'.
              Returns an empty list if the file is not found or is empty.
    """
    log_entries = []
    if not os.path.exists(file_path):
        print(f"Error: Log file not found at {file_path}")
        return log_entries

    with open(file_path, 'r') as f:
        for i, line in enumerate(f):
            line_content = line.strip()
            if line_content:
                try:
                    entry = json.loads(line_content)
                    entry['_line_number'] = i + 1
                    # Calculate SHA256 hash of the raw line content
                    entry['entry_sha256_hash'] = hashlib.sha256(line_content.encode('utf-8')).hexdigest()
                    log_entries.append(entry)
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON on line {i+1} in {file_path}: {e}")
                    # Optionally, add a placeholder or skip the line
                    log_entries.append({
                        '_line_number': i + 1,
                        'error': 'JSONDecodeError',
                        'raw_line': line_content,
                        'entry_sha256_hash': hashlib.sha256(line_content.encode('utf-8')).hexdigest()
                    })
    return log_entries

def calculate_file_sha256(file_path):
    """Calculates the SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    if not os.path.exists(file_path):
        return None
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

