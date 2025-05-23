# Phase 5.3: Merkle Sealing of Output + Conflict Metadata

## Codex Contract Reference
- **Contract Version:** v2025.05.18
- **Phase ID:** 5.3
- **Title:** Merkle Sealing of Output + Conflict Metadata
- **Description:** Implement Merkle tree-based sealing of execution outputs and conflict metadata for tamper-evident logging and arbitration preparation
- **Clauses:** 5.3, 11.0, 10.4, 5.2.5
- **Schema Registry:** 
  - merkle_seal.schema.v1.json
  - conflict_metadata.schema.v1.json

## Repository Structure Lock
As per Codex clause 5.2.5 "Codex Repository Hygiene Freeze", Phase 5.3 shall execute under the current repository structure. Directory normalization is postponed until after trust seal propagation is complete.

## Architecture Overview

Phase 5.3 builds upon the Replay Reproducibility Seal (Phase 5.2) by extending the cryptographic sealing mechanism to include execution outputs and conflict metadata. This creates a tamper-evident record of all system outputs and any conflicts that arise during execution, enabling robust arbitration and governance enforcement.

### Core Components

1. **Merkle Sealing Engine**
   - Creates and manages Merkle trees for execution outputs
   - Generates cryptographic seals with conflict metadata
   - Maintains a chain of seals for continuous verification

2. **Conflict Detection System**
   - Identifies and categorizes conflicts during execution
   - Generates structured conflict metadata
   - Assigns severity levels and initiates resolution paths

3. **Output Capture Mechanism**
   - Intercepts and records all system outputs
   - Normalizes output formats for consistent hashing
   - Links outputs to their originating execution context

4. **Arbitration Preparation Module**
   - Prepares conflict data for potential arbitration
   - Maintains evidence chains for dispute resolution
   - Implements resolution path tracking

5. **Trust Surface Integration**
   - Extends the Trust Log UI to display Merkle seals
   - Visualizes conflict metadata and resolution status
   - Provides verification interfaces for sealed outputs

### Data Flow

1. System execution produces outputs and potentially identifies conflicts
2. Outputs are captured and normalized
3. Conflicts are detected, categorized, and metadata is generated
4. Outputs and conflict metadata are organized into a Merkle tree
5. A Merkle seal is created, linking to previous seals in the chain
6. The seal is stored and made available for verification
7. Trust UI is updated to display the new seal and any conflicts

## Schema Definitions

### Merkle Seal Schema (merkle_seal.schema.v1.json)

The Merkle Seal Schema defines the structure for cryptographic seals that provide tamper-evidence for execution logs and outputs. Each seal includes:

- A unique identifier
- The Merkle root hash
- Timestamp and contract metadata
- Conflict metadata (if any)
- Tree structure information
- References to sealed entries
- Links to previous seals in the chain

This schema is governed by Codex clauses 5.3 and 11.0, ensuring that all seals maintain the integrity of the governance chain.

### Conflict Metadata Schema (conflict_metadata.schema.v1.json)

The Conflict Metadata Schema defines the structure for recording and tracking conflicts that arise during system execution. Each conflict record includes:

- A unique conflict identifier
- Conflict type and severity
- Involved agent IDs
- Timestamp and verification data
- Detailed conflict information
- Resolution path tracking
- Arbitration metadata

This schema is governed by Codex clauses 5.3 and 10.4, ensuring that all conflicts are properly documented for resolution and arbitration.

## Implementation Components

### 1. Merkle Tree Implementation

```python
class MerkleTree:
    """
    Implements a Merkle tree for tamper-evident logging.
    
    This component implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.3
    Clauses: 5.3, 11.0
    """
    
    def __init__(self, algorithm="sha256"):
        """Initialize a new Merkle tree."""
        self.algorithm = algorithm
        self.leaves = []
        self.nodes = []
        self.root_hash = None
    
    def add_leaf(self, data):
        """Add a leaf node to the Merkle tree."""
        # Hash the data if it's not already a hash
        if not isinstance(data, str) or not re.match(r'^[a-f0-9]{64}$', data):
            data_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        else:
            data_hash = data
        
        self.leaves.append(data_hash)
        return data_hash
    
    def build_tree(self):
        """Build the Merkle tree from the current leaves."""
        if not self.leaves:
            raise ValueError("Cannot build Merkle tree with no leaves")
        
        # Start with the leaves
        self.nodes = [self.leaves]
        
        # Build the tree bottom-up
        while len(self.nodes[-1]) > 1:
            level = []
            for i in range(0, len(self.nodes[-1]), 2):
                if i + 1 < len(self.nodes[-1]):
                    # Hash the pair of nodes
                    combined = self.nodes[-1][i] + self.nodes[-1][i + 1]
                    level.append(hashlib.sha256(combined.encode()).hexdigest())
                else:
                    # Odd number of nodes, promote the last one
                    level.append(self.nodes[-1][i])
            self.nodes.append(level)
        
        # The root is the last node in the last level
        self.root_hash = self.nodes[-1][0]
        return self.root_hash
    
    def get_proof(self, leaf_index):
        """Get the Merkle proof for a specific leaf."""
        if not self.root_hash:
            raise ValueError("Merkle tree not built yet")
        
        proof = []
        for level in range(len(self.nodes) - 1):
            is_right = leaf_index % 2 == 1
            if is_right:
                pair_index = leaf_index - 1
            else:
                pair_index = leaf_index + 1
            
            if pair_index < len(self.nodes[level]):
                proof.append({
                    "position": "right" if is_right else "left",
                    "hash": self.nodes[level][pair_index]
                })
            
            # Move to the parent node
            leaf_index = leaf_index // 2
        
        return proof
    
    def verify_proof(self, leaf_hash, proof, root_hash=None):
        """Verify a Merkle proof for a specific leaf."""
        if not root_hash:
            root_hash = self.root_hash
        
        if not root_hash:
            raise ValueError("Root hash not available")
        
        current_hash = leaf_hash
        
        for step in proof:
            if step["position"] == "right":
                current_hash = hashlib.sha256((current_hash + step["hash"]).encode()).hexdigest()
            else:
                current_hash = hashlib.sha256((step["hash"] + current_hash).encode()).hexdigest()
        
        return current_hash == root_hash
```

### 2. Merkle Seal Generator

```python
class MerkleSealGenerator:
    """
    Generates Merkle seals for execution outputs and conflict metadata.
    
    This component implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.3
    Clauses: 5.3, 11.0
    """
    
    def __init__(self):
        """Initialize the Merkle seal generator."""
        self.merkle_tree = MerkleTree()
        self.previous_seal_id = None
    
    def create_seal(self, outputs, conflict_metadata=None):
        """
        Create a Merkle seal for the given outputs and conflict metadata.
        
        Args:
            outputs: List of execution outputs to seal
            conflict_metadata: Optional conflict metadata to include
            
        Returns:
            A Merkle seal object conforming to merkle_seal.schema.v1.json
        """
        # Validate against schema
        if conflict_metadata:
            is_valid, error = validate_against_schema(
                conflict_metadata, 
                "conflict_metadata.schema.v1.json"
            )
            if not is_valid:
                raise ValueError(f"Invalid conflict metadata: {error}")
        
        # Add outputs to Merkle tree
        sealed_entries = []
        for output in outputs:
            entry_id = output.get("id", str(uuid.uuid4()))
            entry_hash = self.merkle_tree.add_leaf(output)
            sealed_entries.append({
                "entry_id": entry_id,
                "entry_hash": entry_hash
            })
        
        # Build the Merkle tree
        root_hash = self.merkle_tree.build_tree()
        
        # Create the seal
        seal_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Prepare conflict metadata if not provided
        if not conflict_metadata:
            conflict_metadata = {
                "conflict_type": "none",
                "agent_ids": [],
                "timestamp_hash": hashlib.sha256(timestamp.encode()).hexdigest()
            }
        
        # Create the seal object
        seal = {
            "seal_id": seal_id,
            "root_hash": root_hash,
            "timestamp": timestamp,
            "contract_version": "v2025.05.18",
            "phase_id": "5.3",
            "conflict_metadata": conflict_metadata,
            "tree_metadata": {
                "leaf_count": len(self.merkle_tree.leaves),
                "tree_height": len(self.merkle_tree.nodes),
                "algorithm": self.merkle_tree.algorithm
            },
            "sealed_entries": sealed_entries,
            "previous_seal_id": self.previous_seal_id,
            "codex_clauses": ["5.3", "11.0"]
        }
        
        # Validate the seal against schema
        is_valid, error = validate_against_schema(seal, "merkle_seal.schema.v1.json")
        if not is_valid:
            raise ValueError(f"Invalid Merkle seal: {error}")
        
        # Update previous seal ID for chaining
        self.previous_seal_id = seal_id
        
        return seal
    
    def verify_seal(self, seal, outputs=None):
        """
        Verify a Merkle seal.
        
        Args:
            seal: The Merkle seal to verify
            outputs: Optional outputs to verify against the seal
            
        Returns:
            Boolean indicating whether the seal is valid
        """
        # Validate against schema
        is_valid, error = validate_against_schema(seal, "merkle_seal.schema.v1.json")
        if not is_valid:
            return False
        
        # If outputs provided, verify them against the seal
        if outputs:
            # Create a temporary Merkle tree
            temp_tree = MerkleTree()
            
            # Add outputs to the tree
            for output in outputs:
                temp_tree.add_leaf(output)
            
            # Build the tree and check the root hash
            root_hash = temp_tree.build_tree()
            if root_hash != seal["root_hash"]:
                return False
        
        return True
```

### 3. Conflict Detection System

```python
class ConflictDetector:
    """
    Detects and records conflicts during execution.
    
    This component implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.3
    Clauses: 5.3, 10.4
    """
    
    def __init__(self):
        """Initialize the conflict detector."""
        self.active_conflicts = {}
    
    def detect_conflict(self, execution_context, conflict_type, severity="medium"):
        """
        Detect and record a conflict.
        
        Args:
            execution_context: The execution context where the conflict occurred
            conflict_type: Type of conflict detected
            severity: Severity level of the conflict
            
        Returns:
            Conflict metadata object conforming to conflict_metadata.schema.v1.json
        """
        # Generate conflict metadata
        conflict_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        timestamp_hash = hashlib.sha256(timestamp.encode()).hexdigest()
        
        # Extract agent IDs from execution context
        agent_ids = execution_context.get("agent_ids", [])
        if not agent_ids:
            agent_ids = [str(uuid.uuid4())]  # Fallback if no agent IDs available
        
        # Create conflict metadata
        conflict_metadata = {
            "conflict_id": conflict_id,
            "conflict_type": conflict_type,
            "agent_ids": agent_ids,
            "timestamp": timestamp,
            "timestamp_hash": timestamp_hash,
            "contract_version": "v2025.05.18",
            "phase_id": "5.3",
            "severity": severity,
            "resolution_status": "unresolved",
            "conflict_details": {
                "description": f"{conflict_type} conflict detected during execution",
                "affected_components": execution_context.get("components", []),
                "evidence": []
            },
            "resolution_path": [],
            "arbitration_metadata": {
                "arbitration_status": "not_required"
            },
            "codex_clauses": ["5.3", "10.4"]
        }
        
        # Add evidence based on conflict type
        if conflict_type == "schema_violation":
            conflict_metadata["conflict_details"]["evidence"].append({
                "evidence_type": "schema_validation",
                "evidence_data": {
                    "schema": execution_context.get("schema", "unknown"),
                    "validation_error": execution_context.get("error", "unknown")
                }
            })
        elif conflict_type == "trust_threshold":
            conflict_metadata["conflict_details"]["evidence"].append({
                "evidence_type": "trust_score",
                "evidence_data": {
                    "trust_score": execution_context.get("trust_score", 0),
                    "threshold": execution_context.get("threshold", 0.7)
                }
            })
        elif conflict_type == "tether_failure":
            conflict_metadata["conflict_details"]["evidence"].append({
                "evidence_type": "tether_check",
                "evidence_data": {
                    "tether_check": "pre_loop_tether_check",
                    "failure_reason": execution_context.get("failure_reason", "unknown")
                }
            })
        
        # Validate against schema
        is_valid, error = validate_against_schema(
            conflict_metadata, 
            "conflict_metadata.schema.v1.json"
        )
        if not is_valid:
            raise ValueError(f"Invalid conflict metadata: {error}")
        
        # Store active conflict
        self.active_conflicts[conflict_id] = conflict_metadata
        
        return conflict_metadata
    
    def update_resolution(self, conflict_id, action, result, actor="system"):
        """
        Update the resolution path for a conflict.
        
        Args:
            conflict_id: ID of the conflict to update
            action: Action taken to resolve the conflict
            result: Result of the action
            actor: Entity that performed the action
            
        Returns:
            Updated conflict metadata
        """
        if conflict_id not in self.active_conflicts:
            raise ValueError(f"Conflict {conflict_id} not found")
        
        conflict = self.active_conflicts[conflict_id]
        
        # Add resolution step
        step_id = len(conflict["resolution_path"]) + 1
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        resolution_step = {
            "step_id": step_id,
            "action": action,
            "timestamp": timestamp,
            "actor": actor,
            "result": result
        }
        
        conflict["resolution_path"].append(resolution_step)
        
        # Update resolution status
        if "resolved" in result.lower():
            conflict["resolution_status"] = "resolved"
        elif "escalated" in result.lower():
            conflict["resolution_status"] = "escalated"
        else:
            conflict["resolution_status"] = "in_progress"
        
        # Validate against schema
        is_valid, error = validate_against_schema(
            conflict, 
            "conflict_metadata.schema.v1.json"
        )
        if not is_valid:
            raise ValueError(f"Invalid conflict metadata: {error}")
        
        return conflict
```

### 4. Output Capture Mechanism

```python
class OutputCapture:
    """
    Captures and normalizes execution outputs for sealing.
    
    This component implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.3
    Clauses: 5.3
    """
    
    def __init__(self):
        """Initialize the output capture mechanism."""
        self.captured_outputs = []
    
    def capture_output(self, output, source, output_type="response"):
        """
        Capture and normalize an execution output.
        
        Args:
            output: The output data to capture
            source: Source of the output (e.g., agent ID, component name)
            output_type: Type of output (e.g., response, log, error)
            
        Returns:
            Normalized output object ready for sealing
        """
        # Generate output ID
        output_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Normalize output format
        if isinstance(output, str):
            normalized_output = output
        elif isinstance(output, dict):
            normalized_output = json.dumps(output, sort_keys=True)
        else:
            normalized_output = str(output)
        
        # Create output object
        output_obj = {
            "id": output_id,
            "timestamp": timestamp,
            "source": source,
            "type": output_type,
            "content": normalized_output,
            "hash": hashlib.sha256(normalized_output.encode()).hexdigest()
        }
        
        # Store captured output
        self.captured_outputs.append(output_obj)
        
        return output_obj
    
    def get_outputs(self, clear=False):
        """
        Get all captured outputs.
        
        Args:
            clear: Whether to clear the captured outputs after retrieval
            
        Returns:
            List of captured outputs
        """
        outputs = self.captured_outputs.copy()
        
        if clear:
            self.captured_outputs = []
        
        return outputs
```

### 5. Integration with Runtime Executor

```python
# Add to runtime_executor.py

# Import the new components
from merkle_sealing import MerkleSealGenerator
from conflict_detection import ConflictDetector
from output_capture import OutputCapture

# Initialize components
merkle_seal_generator = MerkleSealGenerator()
conflict_detector = ConflictDetector()
output_capture = OutputCapture()

# Add to execution loop
def execute_loop(loop_input, options=None):
    """
    Execute a loop with the given input and options.
    
    This function implements Phase 5.3 of the Promethios roadmap.
    Codex Contract: v2025.05.18
    Phase ID: 5.3
    Clauses: 5.3, 11.0, 10.4
    """
    # Existing code...
    
    # Capture outputs
    output_obj = output_capture.capture_output(
        output=result,
        source="loop_execution",
        output_type="response"
    )
    
    # Check for conflicts
    conflict_metadata = None
    if "error" in result:
        # Detect conflict if there's an error
        conflict_metadata = conflict_detector.detect_conflict(
            execution_context={
                "agent_ids": [agent_id],
                "components": ["loop_execution"],
                "error": result["error"]
            },
            conflict_type="schema_violation",
            severity="medium"
        )
    
    # Create Merkle seal
    outputs = output_capture.get_outputs(clear=True)
    merkle_seal = merkle_seal_generator.create_seal(
        outputs=outputs,
        conflict_metadata=conflict_metadata
    )
    
    # Store the seal
    store_merkle_seal(merkle_seal)
    
    # Add seal ID to result
    result["merkle_seal_id"] = merkle_seal["seal_id"]
    
    # Existing code...
    
    return result

# Add storage function
def store_merkle_seal(merkle_seal):
    """Store a Merkle seal in the database."""
    # Create seals directory if it doesn't exist
    os.makedirs("logs/merkle_seals", exist_ok=True)
    
    # Write seal to file
    seal_id = merkle_seal["seal_id"]
    seal_path = f"logs/merkle_seals/{seal_id}.json"
    
    with open(seal_path, "w") as f:
        json.dump(merkle_seal, f, indent=2)
    
    # Update seal index
    index_path = "logs/merkle_seals/index.json"
    seal_index = []
    
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            seal_index = json.load(f)
    
    seal_index.append({
        "seal_id": seal_id,
        "timestamp": merkle_seal["timestamp"],
        "root_hash": merkle_seal["root_hash"],
        "conflict_type": merkle_seal["conflict_metadata"]["conflict_type"]
    })
    
    with open(index_path, "w") as f:
        json.dump(seal_index, f, indent=2)
```

### 6. Trust UI Integration

```javascript
// Add to TrustLogUI.js

// Import components
import MerkleSealViewer from './MerkleSealViewer';
import ConflictMetadataViewer from './ConflictMetadataViewer';

// Add to TrustLogUI component
function TrustLogUI() {
  // Existing code...
  
  const [merkleSeals, setMerkleSeals] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  
  // Fetch Merkle seals
  useEffect(() => {
    async function fetchMerkleSeals() {
      try {
        const response = await fetch('/api/merkle_seals');
        const data = await response.json();
        setMerkleSeals(data);
      } catch (error) {
        console.error('Error fetching Merkle seals:', error);
      }
    }
    
    fetchMerkleSeals();
  }, []);
  
  // Fetch conflicts
  useEffect(() => {
    async function fetchConflicts() {
      try {
        const response = await fetch('/api/conflicts');
        const data = await response.json();
        setConflicts(data);
      } catch (error) {
        console.error('Error fetching conflicts:', error);
      }
    }
    
    fetchConflicts();
  }, []);
  
  // Add tabs for Merkle seals and conflicts
  return (
    <div className="trust-log-ui">
      <h1>Trust Log UI</h1>
      
      <Tabs>
        {/* Existing tabs */}
        
        <Tab label="Merkle Seals">
          <MerkleSealViewer seals={merkleSeals} />
        </Tab>
        
        <Tab label="Conflicts">
          <ConflictMetadataViewer conflicts={conflicts} />
        </Tab>
      </Tabs>
    </div>
  );
}
```

## Testing Strategy

### 1. Unit Tests

Create comprehensive unit tests for each component:

- MerkleTree
- MerkleSealGenerator
- ConflictDetector
- OutputCapture

### 2. Integration Tests

Test the integration of all components:

- Merkle sealing of outputs
- Conflict detection and resolution
- Chain of seals verification

### 3. End-to-End Tests

Test the complete flow from execution to UI visualization:

- Execute a loop with various inputs
- Verify Merkle seals are created
- Check conflict detection for error cases
- Validate UI display of seals and conflicts

## Implementation Timeline

1. **Week 1: Core Components**
   - Implement MerkleTree and MerkleSealGenerator
   - Create ConflictDetector and OutputCapture
   - Write unit tests for all components

2. **Week 2: Integration**
   - Integrate with runtime_executor.py
   - Implement seal storage and retrieval
   - Create API endpoints for UI access

3. **Week 3: UI and Testing**
   - Implement UI components for seal and conflict visualization
   - Write integration and end-to-end tests
   - Document the implementation

## Codex Compliance

This implementation adheres to the Codex Contract Tethering Protocol with:

1. **Schema Validation**: All data structures are validated against their respective schemas
2. **Contract References**: All components include explicit contract version and phase ID references
3. **Clause Binding**: All functionality is explicitly bound to Codex clauses
4. **Repository Structure**: Implementation respects clause 5.2.5, maintaining the current repository structure

## Future Compatibility

This implementation is designed to be compatible with:

1. **Phase 5.4**: Distributed Verification Network
2. **Phase 6.1**: Governance Mesh Integration
3. **Phase 10.4**: Conflict Resolution Framework

By implementing Merkle sealing of outputs and conflict metadata, we establish the foundation for these future phases while maintaining strict governance integrity.
