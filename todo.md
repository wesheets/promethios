# CMU Benchmark Real Governance Integration

## Phase 1: Fix CMU Benchmark Integration

### Current Issues:
- [ ] Fake governance responses with text prefixes
- [ ] No real cryptographic seals generated
- [ ] Chat sessions mixing between agents
- [ ] No real trust scores or governance metadata

### Implementation Plan:
1. Replace fake governance with real `/loop/execute` API calls
2. Generate actual cryptographic seals for governed responses
3. Fix chat session isolation per agent+governance mode
4. Display real trust scores and governance metadata

### Next Phases:
2. Fix demo agents visibility in wrappers
3. Improve chat interfaces
4. Test and validate all fixes

