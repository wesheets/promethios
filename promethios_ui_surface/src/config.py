import os

# Get the absolute path of the project root directory
# This assumes config.py is in src/, which is in promethios_ui_surface, which is in the repository root
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.dirname(CURRENT_DIR)
UI_ROOT = os.path.dirname(SRC_DIR)
REPO_ROOT = os.path.dirname(UI_ROOT)  # Get the repository root dynamically

# Default log directory at repository root
LOG_DIR = os.path.join(REPO_ROOT, 'logs')

# Force use of the repository log directory, ignoring environment variables
LOG_DATA_DIR = LOG_DIR

EMOTION_LOG_FILE = os.path.join(LOG_DATA_DIR, 'emotion_telemetry.log.jsonl')
JUSTIFICATION_LOG_FILE = os.path.join(LOG_DATA_DIR, 'justification.log.jsonl')
SHA256_MANIFEST_FILE = os.path.join(LOG_DATA_DIR, 'sha256_manifest.txt')

# Path to the canonical replay script at repository root
REPLAY_SCRIPT_PATH = os.path.join(REPO_ROOT, 'test_deterministic_replay.py')

# Pagination settings
ITEMS_PER_PAGE = 20

# For debugging purposes
print(f"REPO_ROOT: {REPO_ROOT}")
print(f"LOG_DATA_DIR: {LOG_DATA_DIR}")
print(f"EMOTION_LOG_FILE: {EMOTION_LOG_FILE}")
print(f"JUSTIFICATION_LOG_FILE: {JUSTIFICATION_LOG_FILE}")
print(f"SHA256_MANIFEST_FILE: {SHA256_MANIFEST_FILE}")
print(f"REPLAY_SCRIPT_PATH: {REPLAY_SCRIPT_PATH}")
