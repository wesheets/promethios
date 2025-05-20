#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""analyze_component_usage.py: Analyzes component usage based on Codex manifest and logs."""

import argparse
import json
import os
import re
import sys
from collections import defaultdict

CODEX_MANIFEST_DEFAULT = "/home/ubuntu/ResurrectionCodex/manifest.md" 
DEFAULT_JUSTIFICATION_LOGS = ["./logs/justification.log.jsonl"]

def parse_arguments():
    """Parse command-line arguments for component usage analysis."""
    parser = argparse.ArgumentParser(description="Promethios Component Usage Analyzer", formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("--justification-log-files", nargs="+", default=DEFAULT_JUSTIFICATION_LOGS,
                        help=f"Path(s) to justification log file(s) (default: {DEFAULT_JUSTIFICATION_LOGS}).")
    parser.add_argument("--codex-manifest-file", type=str, default=CODEX_MANIFEST_DEFAULT,
                        help=f"Path to the Resurrection Codex manifest file (default: {CODEX_MANIFEST_DEFAULT})")
    parser.add_argument("--output-report-file", type=str, 
                        help="(Optional) Path to save the analysis report. Defaults to stdout.")
    return parser.parse_args()

def load_log_file(file_path):
    """Load a .jsonl log file into a list of dictionaries."""
    if not os.path.exists(file_path):
        print(f"Error: Log file not found: {file_path}", file=sys.stderr)
        return None
    if os.path.getsize(file_path) == 0:
        print(f"Info: Log file is empty: {file_path}", file=sys.stderr)
        return []
    entries = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"Warning: Skipping malformed line {i+1} in {file_path}: {e} - Line: {line.strip()}", file=sys.stderr)
        return entries
    except Exception as e:
        print(f"Error reading log file {file_path}: {e}", file=sys.stderr)
        return None

def parse_codex_manifest(manifest_path):
    """Parses the Codex manifest.md to extract defined components and schemas."""
    defined_items = {"components": set(), "schemas": set()}
    if not os.path.exists(manifest_path):
        print(f"Error: Codex manifest file not found: {manifest_path}", file=sys.stderr)
        return defined_items
    try:
        with open(manifest_path, "r", encoding="utf-8") as f_manifest:
            for line in f_manifest:
                # Simple heuristic: look for lines that might define components or schemas
                # This will need to be adapted to the actual manifest.md structure
                # Example: lines starting with "### Component:" or "#### Schema:"
                # Or lines listing .py files for components, .json files for schemas
                if line.strip().endswith(".py") and "ResurrectionCodex" in line:
                    component_name = os.path.basename(line.strip()).replace(".py","")
                    if component_name not in ["__init__"]:
                         defined_items["components"].add(component_name)
                elif line.strip().endswith(".json") and "Schema_Registry" in line and "schema" in line.lower():
                    defined_items["schemas"].add(os.path.basename(line.strip()))
                elif "Component:" in line:
                    match = re.search(r"Component:\s*(\w+)", line, re.IGNORECASE)
                    if match: defined_items["components"].add(match.group(1))
                elif "Schema:" in line:
                    match = re.search(r"Schema:\s*([\w\.-]+(?:schema(?:\.v\d+)?\.json))", line, re.IGNORECASE)
                    if match: defined_items["schemas"].add(match.group(1))

        # Add known core components/schemas if manifest parsing is too simple
        if not defined_items["components"]: defined_items["components"].add("GovernanceCore") # Expected
        if not defined_items["schemas"]: 
            defined_items["schemas"].add("mgc_emotion_telemetry.schema.json")
            defined_items["schemas"].add("loop_justification_log.schema.v1.json")
            defined_items["schemas"].add("operator_override.schema.v1.json")

    except Exception as e:
        print(f"Error parsing Codex manifest {manifest_path}: {e}", file=sys.stderr)
    return defined_items

def analyze_log_for_invocations(log_entries):
    """Analyzes justification logs to infer component/schema invocations."""
    invoked_items = {"components": set(), "schemas": set()}
    if not log_entries: return invoked_items

    for entry in log_entries:
        # Infer GovernanceCore invocation from any justification log
        invoked_items["components"].add("GovernanceCore") 

        j_data = entry.get("justification_data", {})
        schema_versions = j_data.get("schema_versions", {})
        for schema_key in schema_versions.keys():
            # Attempt to map schema key from log to a schema filename
            if schema_key == "emotion_telemetry":
                invoked_items["schemas"].add("mgc_emotion_telemetry.schema.json")
            elif schema_key == "justification_log":
                invoked_items["schemas"].add("loop_justification_log.schema.v1.json")
            # Add more mappings as needed based on actual schema_versions keys
        
        if j_data.get("override_signal_received") or j_data.get("override_active") or j_data.get("override_required"):
            invoked_items["schemas"].add("operator_override.schema.v1.json") # Implied by override activity

        # agent_id might indicate a component
        agent_id = j_data.get("agent_id")
        if agent_id and "MGC_Kernel" in agent_id : # MGC_Kernel is part of GovernanceCore
            invoked_items["components"].add("GovernanceCore")
        elif agent_id:
            invoked_items["components"].add(agent_id) # Generic component

    return invoked_items

def generate_analysis_report(defined_items, invoked_items, output_file=None):
    """Generates and prints/saves the component usage analysis report."""
    report_lines = []
    report_lines.append("Promethios Component Usage Analysis Report")
    report_lines.append("=" * 50)

    report_lines.append("\nDefined in Codex Manifest:")
    defined_components_str = sorted(list(defined_items["components"])) if defined_items["components"] else 'None Found'
    report_lines.append(f"  Components: {defined_components_str}")
    defined_schemas_str = sorted(list(defined_items["schemas"])) if defined_items["schemas"] else 'None Found'
    report_lines.append(f"  Schemas: {defined_schemas_str}")

    report_lines.append("\nObserved/Inferred from Logs:")
    invoked_components_str = sorted(list(invoked_items["components"])) if invoked_items["components"] else 'None Observed'
    report_lines.append(f"  Invoked Components: {invoked_components_str}")
    referenced_schemas_str = sorted(list(invoked_items["schemas"])) if invoked_items["schemas"] else 'None Observed'
    report_lines.append(f"  Referenced Schemas: {referenced_schemas_str}")

    report_lines.append("\nDiscrepancy Analysis:")
    # Components
    defined_not_invoked_comp = defined_items["components"] - invoked_items["components"]
    invoked_not_defined_comp = invoked_items["components"] - defined_items["components"]
    report_lines.append(f"  Components Defined in Manifest but NOT Observed in Logs: {sorted(list(defined_not_invoked_comp)) if defined_not_invoked_comp else 'None'}")
    report_lines.append(f"  Components Observed in Logs but NOT Defined in Manifest: {sorted(list(invoked_not_defined_comp)) if invoked_not_defined_comp else 'None'}")
    # Schemas
    defined_not_invoked_schema = defined_items["schemas"] - invoked_items["schemas"]
    invoked_not_defined_schema = invoked_items["schemas"] - defined_items["schemas"]
    report_lines.append(f"  Schemas Defined in Manifest but NOT Observed in Logs: {sorted(list(defined_not_invoked_schema)) if defined_not_invoked_schema else 'None'}")
    report_lines.append(f"  Schemas Observed in Logs but NOT Defined in Manifest: {sorted(list(invoked_not_defined_schema)) if invoked_not_defined_schema else 'None'}")

    report_lines.append("\nConclusion:")
    if not invoked_not_defined_comp and not invoked_not_defined_schema:
        report_lines.append("  Based on the provided logs and manifest, there is no evidence of ghost/orphaned components or schemas being invoked.")
        if defined_not_invoked_comp or defined_not_invoked_schema:
            report_lines.append("  Note: Some items defined in the manifest were not observed in the provided log sample. This may be acceptable if not all system paths were exercised by the logs.")
    else:
        report_lines.append("  Potential discrepancies found. Review items listed as 'Observed in Logs but NOT Defined in Manifest'.")
    report_lines.append("=" * 50)

    report_content = "\n".join(report_lines)
    if output_file:
        try:
            with open(output_file, "w", encoding="utf-8") as f_report:
                f_report.write(report_content)
            print(f"Analysis report saved to: {output_file}")
        except IOError as e:
            print(f"Error: Could not write report to {output_file}: {e}", file=sys.stderr)
            print("\nReport Output:\n" + report_content) # Fallback
    else:
        print("\n" + report_content)

def analyze_usage(args):
    print("Starting component usage analysis...")
    defined_items = parse_codex_manifest(args.codex_manifest_file)
    
    all_justification_logs = []
    for log_file_path in args.justification_log_files:
        logs = load_log_file(log_file_path)
        if logs:
            all_justification_logs.extend(logs)
    
    if not all_justification_logs:
        print("No justification log data loaded. Analysis will be based on manifest only.", file=sys.stderr)
    
    invoked_items = analyze_log_for_invocations(all_justification_logs)
    generate_analysis_report(defined_items, invoked_items, args.output_report_file)
    print("Component usage analysis finished.")

def main():
    """Main function to drive the component usage analysis utility."""
    args = parse_arguments()
    analyze_usage(args)

if __name__ == "__main__":
    main()

