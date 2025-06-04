# CMU Interactive Playground: Pre-Deployment Checklist

This checklist should be completed before deploying any changes to the CMU Interactive Playground to prevent deployment failures.

## File Existence Verification

- [ ] `/phase_7_1_prototype/promethios-ui/server.js` exists and is properly configured
- [ ] `/phase_7_1_prototype/promethios-ui/public/cmu-playground/main.js` exists
- [ ] All imported modules in `main.js` exist in their expected locations

## Import Validation

- [ ] No imports of non-existent modules (especially check for `runtimeEnvironmentLoader.js`)
- [ ] All module paths are correct relative to their importing files
- [ ] No circular dependencies exist between modules

## Module Structure Verification

- [ ] `/public/cmu-playground/modules/` directory contains all required modules:
  - [ ] `agentConversation.js`
  - [ ] `emotionalUX.js`
  - [ ] `enhancedFeatures.js`
  - [ ] `exportModule.js`
  - [ ] `metricsManager.js`
  - [ ] `scenarioManager.js`

## React Component Verification

- [ ] `/phase_7_1_prototype/promethios-ui/src/pages/CMUPlaygroundPage.tsx` exists and loads scripts correctly
- [ ] `/phase_7_1_prototype/promethios-ui/src/pages/CMUPlaygroundPage.css` exists with all required styles
- [ ] `/phase_7_1_prototype/promethios-ui/src/components/benchmark/CMUBenchmarkDashboard.tsx` exists and functions

## Local Testing

- [ ] Application builds successfully locally
- [ ] Playground loads correctly in local environment
- [ ] All interactive elements function as expected:
  - [ ] Scenario selection
  - [ ] Governance toggles
  - [ ] Start scenario button
  - [ ] Metrics display

## Deployment Preparation

- [ ] All changes are committed to the correct branch
- [ ] No merge conflicts remain unresolved
- [ ] No temporary or debug code is included in the deployment

## Post-Deployment Verification

- [ ] Application loads correctly after deployment
- [ ] Playground is accessible and interactive
- [ ] No console errors appear in browser developer tools
- [ ] All metrics and visualizations display correctly

## Emergency Recovery Plan

If deployment fails despite passing this checklist:

1. Use Render's rollback feature to restore the last working deployment
2. Compare the deployed code with the last known good state (PR #121, commit f22beb5)
3. Document any new failure points discovered for future checklist updates
