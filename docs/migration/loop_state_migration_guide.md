# Loop State Migration Guide

## Overview

This guide explains the semantic changes to loop state behavior introduced in Promethios 6.4.0 and provides guidance on migrating your code to work with these changes.

## Constitutional Amendment

These changes are formalized in [Constitutional Amendment CGF-2025-01](../../codex/amendments/CGF-2025-01.md), which establishes a more precise semantic distinction between different types of loop termination.

## Semantic Changes

### Pre-6.4 Behavior

In versions prior to 6.4.0, all normal termination conditions (including resource limits and timeouts) would result in a `'completed'` state:

```python
# Pre-6.4 behavior
if termination_reason in ["error", "exception"]:
    state = "failed"
else:
    # All other termination reasons result in 'completed'
    state = "completed"
```

### 6.4.0 Behavior

In version 6.4.0, a semantic distinction is introduced between natural completion and constraint-based termination:

```python
# 6.4.0 behavior
if termination_reason in ["error", "exception"]:
    state = "failed"
elif termination_reason in ["resource_limit_exceeded", "timeout"]:
    state = "aborted"
else:
    state = "completed"
```

## Migration Options

### Option 1: Use Versioned Behavior Adapter (Recommended)

The recommended approach is to use the `LoopStateBehavior` adapter, which supports both pre-6.4 and 6.4.0 behaviors:

```python
from src.versioned_behavior.adapters.loop_state_behavior import LoopStateBehavior
from src.versioned_behavior.core import BehaviorVersion

# To use pre-6.4 behavior
with BehaviorVersion.context("pre_6.4"):
    state = LoopStateBehavior.get_termination_state(termination_reason)

# To use 6.4.0 behavior
with BehaviorVersion.context("6.4.0"):
    state = LoopStateBehavior.get_termination_state(termination_reason)

# Or specify version directly
state = LoopStateBehavior.get_termination_state(termination_reason, version=BehaviorVersion.from_string("6.4.0"))
```

### Option 2: Configuration-Based Approach

If you prefer a configuration-based approach, you can use the `config` parameter in your loop controller:

```python
from src.loop_management.config import LoopConfig

# Create a configuration with legacy behavior
config = LoopConfig(legacy_state_reporting=True)
controller = LoopController(config=config)

# Or use the new behavior
config = LoopConfig(legacy_state_reporting=False)
controller = LoopController(config=config)
```

### Option 3: Direct State Translation

If you need to translate states directly in your code:

```python
def translate_state(state, termination_reason, use_legacy=False):
    if state == "aborted" and use_legacy and termination_reason in ["resource_limit_exceeded", "timeout"]:
        return "completed"
    return state
```

## Testing Your Migration

To ensure your code works correctly with both behavior versions, we recommend:

1. Add tests that explicitly test both behavior versions
2. Use the `with_loop_state_behavior` decorator for test methods:

```python
from src.versioned_behavior.test_fixtures import with_loop_state_behavior

class TestMyComponent(unittest.TestCase):
    
    @with_loop_state_behavior("pre_6.4")
    def test_with_pre_6_4_behavior(self):
        # Test with pre-6.4 behavior
        pass
    
    @with_loop_state_behavior("6.4.0")
    def test_with_6_4_0_behavior(self):
        # Test with 6.4.0 behavior
        pass
```

## Backward Compatibility

The versioned behavior system ensures backward compatibility while allowing you to opt into the new semantics when ready. We recommend:

1. First update your code to use the versioned behavior adapter
2. Test thoroughly with both behavior versions
3. Gradually migrate to the new semantics where appropriate

## Common Migration Challenges

### Challenge: Hardcoded State Expectations

If your code has hardcoded expectations about loop states:

```python
# Before
if state["state"] == "completed":
    # Handle all terminations including resource limits and timeouts
```

Update to:

```python
# After
if state["state"] in ["completed", "aborted"]:
    # Handle all terminations including resource limits and timeouts
```

Or better, check the termination reason:

```python
# Better approach
if state["termination_reason"] in ["normal", "max_iterations", "resource_limit_exceeded", "timeout"]:
    # Handle all terminations regardless of state
```

### Challenge: State-Based Workflows

If you have workflows that depend on specific states:

```python
# Before
if state["state"] == "completed":
    trigger_next_step()
```

Consider using the termination reason instead:

```python
# After
if state["termination_reason"] in ["normal", "max_iterations"]:
    trigger_next_step()
elif state["termination_reason"] in ["resource_limit_exceeded", "timeout"]:
    trigger_resource_handling()
```

## Governance Implications

This semantic change enhances governance by providing more precise state representation. When migrating:

1. Ensure all state transitions are properly logged with behavior version information
2. Update monitoring and alerting systems to recognize the new state semantics
3. Consider the implications for audit trails and compliance reporting

## Further Assistance

If you encounter challenges during migration, please:

1. Consult the [Constitutional Amendment CGF-2025-01](../../codex/amendments/CGF-2025-01.md) for detailed rationale
2. Review the [Versioned Behavior System documentation](../versioned_behavior/index.md)
3. Contact the Promethios Governance Team for assistance
