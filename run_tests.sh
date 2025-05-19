#!/bin/bash
# Set PYTHONPATH for running tests
# Codex Contract: v2025.05.18
# Phase: 5.2.6
# Clauses: 5.2.6, 5.2.5

# Add the current directory to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run the tests with the specified arguments
python -m pytest "$@"
