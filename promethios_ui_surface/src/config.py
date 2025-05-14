# /home/ubuntu/promethios_repo/promethios_ui_surface/src/config.py

import os

# Get the absolute path of the project root directory (promethios_repo)
# This assumes config.py is in src/, and promethios_ui_surface is in promethios_repo
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# Default log directory relative to project root
DEFAULT_LOG_DIR = os.path.join(PROJECT_ROOT, 'logs')

# Configurable paths, using environment variables with defaults
LOG_DATA_DIR = os.getenv('LOG_DATA_DIR', DEFAULT_LOG_DIR)

EMOTION_LOG_FILE = os.path.join(LOG_DATA_DIR, os.getenv('EMOTION_LOG_FILENAME', 'emotion_telemetry.log.jsonl'))
JUSTIFICATION_LOG_FILE = os.path.join(LOG_DATA_DIR, os.getenv('JUSTIFICATION_LOG_FILENAME', 'justification.log.jsonl'))
SHA256_MANIFEST_FILE = os.path.join(LOG_DATA_DIR, os.getenv('SHA256_MANIFEST_FILENAME', 'sha256_manifest.txt'))

# Path to the replay script, relative to project root
REPLAY_SCRIPT_PATH = os.path.join(PROJECT_ROOT, os.getenv('REPLAY_SCRIPT_NAME', 'test_deterministic_replay.py'))

# Pagination settings
ITEMS_PER_PAGE = int(os.getenv('ITEMS_PER_PAGE', 20))

# For debugging purposes
# print(f"PROJECT_ROOT: {PROJECT_ROOT}")
# print(f"LOG_DATA_DIR: {LOG_DATA_DIR}")
# print(f"EMOTION_LOG_FILE: {EMOTION_LOG_FILE}")
# print(f"JUSTIFICATION_LOG_FILE: {JUSTIFICATION_LOG_FILE}")
# print(f"SHA256_MANIFEST_FILE: {SHA256_MANIFEST_FILE}")
# print(f"REPLAY_SCRIPT_PATH: {REPLAY_SCRIPT_PATH}")

