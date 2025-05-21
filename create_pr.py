#!/usr/bin/env python3
import json

# Read PR description
with open('pr_description.md', 'r') as f:
    content = f.read()

# Create payload
payload = {
    "title": "Phase 5.14: Governance Visualization",
    "body": content,
    "head": "feature/phase-5-14-governance-visualization",
    "base": "main"
}

# Write sanitized JSON to file
with open('pr_payload.json', 'w') as f:
    json.dump(payload, f)

print("PR payload JSON created successfully")
