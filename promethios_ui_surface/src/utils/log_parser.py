#!/usr/bin/env python3
# /home/ubuntu/promethios_repo/promethios_ui_surface/src/utils/log_parser.py

import json
import os
import hashlib

def calculate_entry_hash(entry_dict):
    """Calculate SHA256 hash for a log entry using the canonical method.
    
    Args:
        entry_dict: Dictionary containing the log entry data (without hash field)
        
    Returns:
        String containing the hex digest of the SHA256 hash
    """
    # Create a copy of the entry to avoid modifying the original
    entry_copy = entry_dict.copy()
    
    # Remove the hash fields if they exist
    if 'entry_sha256_hash' in entry_copy:
        del entry_copy['entry_sha256_hash']
    if '_line_number' in entry_copy:
        del entry_copy['_line_number']
        
    # Sort keys for deterministic serialization
    entry_json = json.dumps(entry_copy, sort_keys=True)
    
    # Calculate hash
    return hashlib.sha256(entry_json.encode('utf-8')).hexdigest()

def parse_jsonl_log(file_path):
    """Reads and parses a .jsonl log file.

    Args:
        file_path (str): The absolute path to the .jsonl log file.

    Returns:
        list: A list of log entries, where each entry is a dictionary.
              Each entry includes its original line number (1-based) as '_line_number'
              and preserves its embedded 'entry_sha256_hash' and 'previous_entry_hash'.
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
                    
                    # Verify the embedded hash if present
                    if 'entry_sha256_hash' in entry:
                        stored_hash = entry['entry_sha256_hash']
                        calculated_hash = calculate_entry_hash(entry)
                        entry['_hash_verified'] = (stored_hash == calculated_hash)
                    else:
                        # If no embedded hash, calculate one
                        entry['entry_sha256_hash'] = calculate_entry_hash(entry)
                        entry['_hash_verified'] = False
                        
                    # Check chain integrity if previous hash is present
                    if i > 0 and 'previous_entry_hash' in entry and log_entries:
                        previous_entry = log_entries[-1]
                        if 'entry_sha256_hash' in previous_entry:
                            entry['_chain_verified'] = (entry['previous_entry_hash'] == previous_entry['entry_sha256_hash'])
                        else:
                            entry['_chain_verified'] = False
                    
                    log_entries.append(entry)
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON on line {i+1} in {file_path}: {e}")
                    # Optionally, add a placeholder or skip the line
                    log_entries.append({
                        '_line_number': i + 1,
                        'error': 'JSONDecodeError',
                        'raw_line': line_content,
                        'entry_sha256_hash': hashlib.sha256(line_content.encode('utf-8')).hexdigest(),
                        '_hash_verified': False,
                        '_chain_verified': False
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

def verify_log_chain_integrity(log_entries):
    """Verifies the integrity of the hash chain in a list of log entries.
    
    Args:
        log_entries: List of log entries with entry_sha256_hash and previous_entry_hash fields
        
    Returns:
        Tuple of (integrity_verified, broken_chain_indices)
    """
    if not log_entries:
        return True, []
        
    integrity_verified = True
    broken_chain_indices = []
    
    for i in range(1, len(log_entries)):
        current_entry = log_entries[i]
        previous_entry = log_entries[i-1]
        
        if 'previous_entry_hash' in current_entry and 'entry_sha256_hash' in previous_entry:
            if current_entry['previous_entry_hash'] != previous_entry['entry_sha256_hash']:
                integrity_verified = False
                broken_chain_indices.append(i)
                
    return integrity_verified, broken_chain_indices
