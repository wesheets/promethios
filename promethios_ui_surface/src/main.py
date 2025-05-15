#!/usr/bin/env python3
# /home/ubuntu/promethios_clean_pr/promethios_ui_surface/src/main.py
import sys
import os
import json # For parsing emotion_state_at_decision
import subprocess # For manual replay
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, render_template, request, url_for, flash
from datetime import datetime
import logging # Added for enhanced logging

# Import config directly
from src.config import *

# Assuming log_parser.py is in the same 'src' directory or accessible via PYTHONPATH
from src.utils.log_parser import parse_jsonl_log, calculate_file_sha256

app = Flask(__name__)
app.secret_key = os.urandom(24) # Needed for flash messages

# Configure logging
if not app.debug:
    # In production mode, add log handler to sys.stderr
    app.logger.addHandler(logging.StreamHandler())
    app.logger.setLevel(logging.INFO)
else:
    # In debug mode, Flask's default logger is usually sufficient
    # but we can set level explicitly if needed
    app.logger.setLevel(logging.DEBUG)

# Ensure the log directory exists, otherwise create it
if not os.path.exists(LOG_DATA_DIR):
    os.makedirs(LOG_DATA_DIR)

# Create dummy log files if they don't exist, to prevent errors on first run
if not os.path.exists(EMOTION_LOG_FILE):
    with open(EMOTION_LOG_FILE, 'w') as f:
        pass # Create empty file
if not os.path.exists(JUSTIFICATION_LOG_FILE):
    with open(JUSTIFICATION_LOG_FILE, 'w') as f:
        pass # Create empty file
if not os.path.exists(SHA256_MANIFEST_FILE):
    with open(SHA256_MANIFEST_FILE, 'w') as f:
        f.write(f"{os.path.basename(EMOTION_LOG_FILE)} sha256_placeholder\n")
        f.write(f"{os.path.basename(JUSTIFICATION_LOG_FILE)} sha256_placeholder\n")

class Pagination:
    def __init__(self, page, per_page, total_count):
        self.page = page
        self.per_page = per_page
        self.total_count = total_count

    @property
    def pages(self):
        return -(-self.total_count // self.per_page) # Ceiling division

    @property
    def has_prev(self):
        return self.page > 1

    @property
    def has_next(self):
        return self.page < self.pages

    @property
    def prev_num(self):
        return self.page - 1 if self.has_prev else None

    @property
    def next_num(self):
        return self.page + 1 if self.has_next else None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/emotion_logs')
def emotion_logs():
    page = request.args.get('page', 1, type=int)
    emotion_state_filter = request.args.get('emotion_state', '').strip().lower()
    timestamp_start_filter_str = request.args.get('timestamp_start', '').strip()
    timestamp_end_filter_str = request.args.get('timestamp_end', '').strip()

    all_logs = parse_jsonl_log(EMOTION_LOG_FILE)
    filtered_logs = []
    error_message = None

    if not os.path.exists(EMOTION_LOG_FILE):
        error_message = f"Error: Emotion log file not found at {EMOTION_LOG_FILE}"
        all_logs = [] # Ensure all_logs is empty if file not found
    
    for log_entry in all_logs:
        telemetry_data = log_entry.get('telemetry_data', {})
        if not isinstance(telemetry_data, dict):
            telemetry_data = {}
            
        passes_filter = True
        if emotion_state_filter:
            current_emotion = telemetry_data.get('current_emotion_state', '').lower()
            if emotion_state_filter not in current_emotion:
                passes_filter = False
        
        log_timestamp_str = telemetry_data.get('timestamp')
        if not log_timestamp_str:
            log_timestamp_str = log_entry.get('timestamp_capture') 

        if log_timestamp_str and passes_filter:
            try:
                try:
                    log_dt = datetime.fromisoformat(log_timestamp_str.replace('Z', '+00:00'))
                except ValueError:
                    log_dt = datetime.strptime(log_timestamp_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")

                if timestamp_start_filter_str:
                    filter_start_dt = datetime.fromisoformat(timestamp_start_filter_str)
                    if log_dt < filter_start_dt:
                        passes_filter = False
                if timestamp_end_filter_str and passes_filter:
                    filter_end_dt = datetime.fromisoformat(timestamp_end_filter_str)
                    if log_dt > filter_end_dt:
                        passes_filter = False
            except ValueError as e:
                pass 
        elif (timestamp_start_filter_str or timestamp_end_filter_str) and not log_timestamp_str:
             passes_filter = False

        if passes_filter:
            filtered_logs.append(log_entry)

    total_logs = len(filtered_logs)
    start_index = (page - 1) * ITEMS_PER_PAGE
    end_index = start_index + ITEMS_PER_PAGE
    paginated_logs = filtered_logs[start_index:end_index]

    pagination_obj = Pagination(page, ITEMS_PER_PAGE, total_logs)

    return render_template('emotion_logs.html', 
                           logs=paginated_logs, 
                           pagination=pagination_obj,
                           error_message=error_message)

@app.route('/justification_logs')
def justification_logs():
    page = request.args.get('page', 1, type=int)
    decision_outcome_filter = request.args.get('decision_outcome', '').strip().lower()
    override_required_filter = request.args.get('override_required', '').strip().lower()
    timestamp_start_filter_str = request.args.get('timestamp_start', '').strip()
    timestamp_end_filter_str = request.args.get('timestamp_end', '').strip()

    all_logs = parse_jsonl_log(JUSTIFICATION_LOG_FILE)
    filtered_logs = []
    error_message = None

    if not os.path.exists(JUSTIFICATION_LOG_FILE):
        error_message = f"Error: Justification log file not found at {JUSTIFICATION_LOG_FILE}"
        all_logs = []

    for log_entry in all_logs:
        justification_data = log_entry.get('justification_data', {})
        if not isinstance(justification_data, dict):
            justification_data = {}

        passes_filter = True

        if decision_outcome_filter:
            decision_outcome = justification_data.get('decision_outcome', '').lower()
            if decision_outcome_filter not in decision_outcome:
                passes_filter = False
        
        if override_required_filter:
            override_required = str(justification_data.get('override_required', '')).lower()
            if override_required_filter != override_required:
                passes_filter = False

        log_timestamp_str = justification_data.get('timestamp')
        if not log_timestamp_str:
            log_timestamp_str = log_entry.get('timestamp_capture')
        
        if log_timestamp_str and passes_filter:
            try:
                try:
                    log_dt = datetime.fromisoformat(log_timestamp_str.replace('Z', '+00:00'))
                except ValueError:
                    log_dt = datetime.strptime(log_timestamp_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")

                if timestamp_start_filter_str:
                    filter_start_dt = datetime.fromisoformat(timestamp_start_filter_str)
                    if log_dt < filter_start_dt:
                        passes_filter = False
                if timestamp_end_filter_str and passes_filter:
                    filter_end_dt = datetime.fromisoformat(timestamp_end_filter_str)
                    if log_dt > filter_end_dt:
                        passes_filter = False
            except ValueError as e:
                pass 
        elif (timestamp_start_filter_str or timestamp_end_filter_str) and not log_timestamp_str:
            passes_filter = False
        
        emotion_state_str = justification_data.get('emotion_state_at_decision')
        if isinstance(emotion_state_str, str):
            try:
                # Attempt to parse, pretty print if successful
                parsed_emotion_state = json.loads(emotion_state_str)
                justification_data['emotion_state_at_decision'] = json.dumps(parsed_emotion_state, indent=2)
            except json.JSONDecodeError:
                # Keep as string if parsing fails
                justification_data['emotion_state_at_decision'] = emotion_state_str

        if passes_filter:
            filtered_logs.append(log_entry)

    total_logs = len(filtered_logs)
    start_index = (page - 1) * ITEMS_PER_PAGE
    end_index = start_index + ITEMS_PER_PAGE
    paginated_logs = filtered_logs[start_index:end_index]

    pagination_obj = Pagination(page, ITEMS_PER_PAGE, total_logs)

    return render_template('justification_logs.html', 
                           logs=paginated_logs, 
                           pagination=pagination_obj,
                           error_message=error_message)

@app.route('/integrity_check')
def integrity_check():
    integrity_results = []
    error_message = None
    if not os.path.exists(SHA256_MANIFEST_FILE):
        error_message = f"Error: SHA256 Manifest file not found at {SHA256_MANIFEST_FILE}"
        return render_template('integrity_check.html', integrity_results=integrity_results, error_message=error_message)

    try:
        with open(SHA256_MANIFEST_FILE, 'r') as f_manifest:
            for line in f_manifest:
                line = line.strip()
                if not line or ' ' not in line:
                    continue 
                
                parts = line.split(' ', 1) 
                relative_file_path = parts[0]
                expected_hash = parts[1]
                
                absolute_file_path = os.path.join(LOG_DATA_DIR, relative_file_path)
                
                result_entry = {
                    'file_path': relative_file_path, 
                    'expected_hash': expected_hash,
                    'calculated_hash': None,
                    'status': 'Error'
                }

                if not os.path.exists(absolute_file_path):
                    result_entry['status'] = 'File Not Found'
                else:
                    calculated_hash = calculate_file_sha256(absolute_file_path)
                    result_entry['calculated_hash'] = calculated_hash
                    if calculated_hash == expected_hash:
                        result_entry['status'] = 'Valid'
                    else:
                        result_entry['status'] = 'Invalid'
                integrity_results.append(result_entry)
    except Exception as e:
        error_message = f"Error processing manifest file: {e}"

    return render_template('integrity_check.html', integrity_results=integrity_results, error_message=error_message)

@app.route('/replay', methods=['GET', 'POST'])
def replay():
    replay_output_str = None
    error_message_str = None
    if request.method == 'POST':
        scenario_id = request.form.get('scenario_id_or_log_file')
        loop_input_path_form = request.form.get('loop_input_json_path') # Optional

        app.logger.info(f"Replay initiated with Scenario ID/Log File: {scenario_id}")
        app.logger.info(f"Replay script path: {REPLAY_SCRIPT_PATH}")
        if loop_input_path_form:
            app.logger.info(f"Loop input path from form: {loop_input_path_form}")

        if not scenario_id:
            error_message_str = "Scenario ID / Log File Path is required."
            return render_template('replay.html', error_message=error_message_str)

        if not os.path.exists(REPLAY_SCRIPT_PATH):
            error_message_str = f"Replay script not found at {REPLAY_SCRIPT_PATH}"
            app.logger.error(error_message_str)
            return render_template('replay.html', error_message=error_message_str, replay_output=replay_output_str)
        
        python_executable = sys.executable 
        cmd = [python_executable, REPLAY_SCRIPT_PATH, '--scenario', scenario_id]
        
        if loop_input_path_form:
            abs_loop_input_path = os.path.abspath(loop_input_path_form)
            app.logger.info(f"Absolute loop input path: {abs_loop_input_path}")
            # Ensure loop_input_path is within an expected directory if it's user-provided
            # For this example, we assume LOG_DATA_DIR is a safe base if the script expects files from there.
            if '..' in loop_input_path_form or not abs_loop_input_path.startswith(os.path.abspath(LOG_DATA_DIR)):
                 error_message_str = "Invalid loop input path. Path must be within the configured LOG_DATA_DIR."
                 app.logger.warning(f"Invalid loop input path attempt: {loop_input_path_form}")
                 return render_template('replay.html', error_message=error_message_str, replay_output=replay_output_str)
            cmd.extend(['--loop_input', loop_input_path_form])

        app.logger.info(f"Executing replay command: {' '.join(cmd)}")
        try:
            process = subprocess.run(cmd, capture_output=True, text=True, check=False, cwd=REPO_ROOT, timeout=60)
            
            stdout_content = process.stdout.strip()
            stderr_content = process.stderr.strip()

            replay_output_str = f"Return Code: {process.returncode}\n"
            if not stdout_content and not stderr_content:
                replay_output_str += "STDOUT:\nNo output received from script.\n"
            elif not stdout_content and stderr_content:
                replay_output_str += "STDOUT:\nNo output received from script.\n"
                replay_output_str += "STDERR:\n" + process.stderr
            else:
                replay_output_str += "STDOUT:\n" + process.stdout
                if stderr_content: # Only add STDERR if it has content
                    replay_output_str += "STDERR:\n" + process.stderr

            app.logger.info(f"Replay STDOUT: {process.stdout}")
            app.logger.info(f"Replay STDERR: {process.stderr}")
            app.logger.info(f"Replay Return Code: {process.returncode}")

            if process.returncode != 0:
                 flash(f"Replay script exited with error code: {process.returncode}. STDERR: {process.stderr}", "error")

        except subprocess.TimeoutExpired:
            error_message_str = "Replay script timed out after 60 seconds."
            replay_output_str = "Timeout occurred."
            app.logger.error(error_message_str)
            flash(error_message_str, "error")
        except Exception as e:
            error_message_str = f"Error executing replay script: {e}"
            replay_output_str = f"Execution failed: {e}"
            app.logger.error(error_message_str, exc_info=True)
            flash(error_message_str, "error")
            
    return render_template('replay.html', replay_output=replay_output_str, error_message=error_message_str)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
