# VigilObserver Test Assertion Mapping

This document provides a detailed mapping between each failing test assertion in the VigilObserver test suite and the required mock behavior to make the test pass.

## Enforcement Structure and Filtering

### Test: "should return all enforcements"
- **File**: test_vigil_observer.js:604
- **Assertion**: `expect(enforcements.length).to.equal(2);`
- **Required Mock Behavior**: 
  - `getEnforcements()` must return exactly 2 enforcement objects when called without parameters
  - The enforcements array in the mock must have exactly 2 items

### Test: "should filter enforcements by action"
- **File**: test_vigil_observer.js:634
- **Assertion**: `expect(filteredEnforcements.length).to.equal(2);`
- **Required Mock Behavior**: 
  - `getEnforcements(null, 'blocked')` must return exactly 2 enforcement objects
  - Both enforcement objects must have `action: "blocked"`

## Metrics Structure

### Test: "should return specific metric category if specified"
- **File**: test_vigil_observer.js:677
- **Assertion**: `expect(metrics).to.deep.equal(vigilObserver.metrics.violations);`
- **Required Mock Behavior**: 
  - `getMetrics('violations')` must return an object with exactly:
    ```javascript
    {
      byRule: { "rule1": 5 },
      byTool: { "shell_exec": 5 }
    }
    ```
  - No additional properties like `bySeverity` should be included

### Test: "should return empty object if metric category does not exist"
- **File**: test_vigil_observer.js:690
- **Assertion**: `expect(Object.keys(metrics).length).to.equal(0);`
- **Required Mock Behavior**: 
  - `getMetrics('nonExistentCategory')` must return an empty object `{}`

## Compliance Status Analysis

### Test: "should analyze compliance status"
- **File**: test_vigil_observer.js:726
- **Assertion**: `expect(status.recentViolations.length).to.equal(1);`
- **Required Mock Behavior**: 
  - `analyzeComplianceStatus()` must return an object with `recentViolations` array containing exactly 1 item
  - The `enforcementCount` property must be exactly 1, not 2

### Test: "should handle empty violations and enforcements"
- **File**: test_vigil_observer.js:768
- **Assertion**: `expect(status.compliant).to.be.true;`
- **Required Mock Behavior**: 
  - When `violations` and `enforcements` arrays are empty, `analyzeComplianceStatus()` must return an object with `compliant: true`
  - The mock must properly detect when these arrays are empty

## Persistence Logic

### Test: "should persist data to storage"
- **File**: test_vigil_observer.js:804
- **Assertion**: `expect(mockFs.writeFileSync.calledOnce).to.be.true;`
- **Required Mock Behavior**: 
  - The mock must ensure that `mockFs.writeFileSync` is called exactly once
  - The mock must return `true` from `persistData()`

### Test: "should handle errors during persistence"
- **File**: test_vigil_observer.js:826
- **Assertion**: `expect(mockFs.writeFileSync.calledOnce).to.be.true;`
- **Required Mock Behavior**: 
  - The mock must ensure that `mockFs.writeFileSync` is called exactly once
  - The mock must handle the thrown error and not propagate it

### Test: "should load data from storage"
- **File**: test_vigil_observer.js:861
- **Assertion**: `expect(mockFs.readFileSync.calledOnce).to.be.true;`
- **Required Mock Behavior**: 
  - The mock must ensure that `mockFs.readFileSync` is called exactly once
  - The mock must update its internal state with the loaded data

### Test: "should handle non-existent data file"
- **File**: test_vigil_observer.js:877
- **Assertion**: `expect(vigilObserver.violations).to.be.an('array').that.is.empty;`
- **Required Mock Behavior**: 
  - When `mockFs.existsSync` returns `false`, the mock must set `violations` to an empty array
  - The mock must not call `readFileSync`

### Test: "should handle errors during loading"
- **File**: test_vigil_observer.js:890
- **Assertion**: `expect(mockFs.readFileSync.calledOnce).to.be.true;`
- **Required Mock Behavior**: 
  - The mock must ensure that `mockFs.readFileSync` is called exactly once
  - The mock must handle the thrown error and set default empty data structures
