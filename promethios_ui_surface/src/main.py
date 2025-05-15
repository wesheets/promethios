# /home/ubuntu/promethios_repo/promethios_ui_surface/src/main.py
import sys
import os
import json # For parsing emotion_state_at_decision
import subprocess # For manual replay
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, render_template, request, url_for, flash
from datetime import datetime

# Assuming config.py and log_parser.py are in the same 'src' directory or accessible via PYTHONPATH
from src.config import EMOTION_LOG_FILE, JUSTIFICATION_LOG_FILE, SHA256_MANIFEST_FILE, REPLAY_SCRIPT_PATH, ITEMS_PER_PAGE, LOG_DATA_DIR, PROJECT_ROOT
from src.utils.log_parser import parse_jsonl_log, calculate_file_sha256

app = Flask(__name__)
app.secret_key = os.urandom(24) # Needed for flash messages

# app.config["SQLALCHEMY_DATABASE_URI"] = f"mysql+pymysql://{os.getenv('DB_USERNAME', 'root')}:{os.getenv('DB_PASSWORD', 'password')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'mydb')}"

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
        loop_input_path = request.form.get('loop_input_json_path') # Optional

        if not scenario_id:
            error_message_str = "Scenario ID / Log File Path is required."
            return render_template('replay.html', error_message=error_message_str)

        if not os.path.exists(REPLAY_SCRIPT_PATH):
            error_message_str = f"Replay script not found at {REPLAY_SCRIPT_PATH}"
            return render_template('replay.html', error_message=error_message_str, replay_output=replay_output_str)
        
        # Use sys.executable to ensure the correct Python interpreter is used
        python_executable = sys.executable 
        cmd = [python_executable, REPLAY_SCRIPT_PATH, '--scenario', scenario_id]
        if loop_input_path:
            # Security: Basic check for path traversal, though more robust validation is better
            # Ensure loop_input_path is within an expected directory if it's user-provided and not a fixed set of options
            # For this example, we assume LOG_DATA_DIR is a safe base if the script expects files from there.
            # More robust validation might involve checking against a list of allowed paths or ensuring it's a subpath of a trusted root.
            abs_loop_input_path = os.path.abspath(loop_input_path)
            if '..' in loop_input_path or not abs_loop_input_path.startswith(os.path.abspath(LOG_DATA_DIR)):
                 error_message_str = "Invalid loop input path. Path must be within the configured LOG_DATA_DIR."
                 return render_template('replay.html', error_message=error_message_str, replay_output=replay_output_str)
            cmd.extend(['--loop_input', loop_input_path])

        try:
            # Execute in the promethios_repo directory as the script might expect that context
            process = subprocess.run(cmd, capture_output=True, text=True, check=False, cwd=PROJECT_ROOT, timeout=60)
            replay_output_str = f"Return Code: {process.returncode}\n"
            replay_output_str += "STDOUT:\n" + process.stdout + "\n"
            replay_output_str += "STDERR:\n" + process.stderr
            if process.returncode != 0:
                 flash(f"Replay script exited with error code: {process.returncode}. STDERR: {process.stderr}", "error")

        except subprocess.TimeoutExpired:
            error_message_str = "Replay script timed out after 60 seconds."
            replay_output_str = "Timeout occurred."
            flash(error_message_str, "error")
        except Exception as e:
            error_message_str = f"Error executing replay script: {e}"
            replay_output_str = f"Execution failed: {e}"
            flash(error_message_str, "error")
            
    return render_template('replay.html', replay_output=replay_output_str, error_message=error_message_str)

if __name__ == '__main__':
    # Make sure to activate the venv: source promethios_ui_surface/venv/bin/activate
    # Then run: python promethios_ui_surface/src/main.py
    app.run(debug=True, host='0.0.0.0', port=5001)

