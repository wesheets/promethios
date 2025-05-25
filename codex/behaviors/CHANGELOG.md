# Promethios Behavioral Changelog

All notable behavioral changes to the Promethios system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.4.0] - 2025-05-25
### Added
- New monitoring events for recovery operations [Amendment-ID: CGF-2025-04]

### Changed
- Loop termination state for resource limits and timeouts now uses 'aborted' instead of 'completed' [Amendment-ID: CGF-2025-01]
- Recovery mechanism now preserves new state keys during checkpoint recovery [Amendment-ID: CGF-2025-02]
- Error recovery now maintains 'failed' state for diagnostic purposes [Amendment-ID: CGF-2025-03]

### Deprecated
- Legacy state reporting without termination reason will be removed in 7.0.0 [Amendment-ID: CGF-2025-05]

### Migration
- [Migration Guide for 6.4.0](/codex/migrations/6.4.0.md)

## [6.3.2] - 2025-05-25
### Added
- Constitutional Governance Framework for behavioral changes [Amendment-ID: CGF-2025-00]
- Versioned Behavior System for explicit behavior versioning [Amendment-ID: CGF-2025-00]
- Governance Wrapping for module instrumentation [Amendment-ID: CGF-2025-00]

### Changed
- All behavioral changes now require constitutional amendments [Amendment-ID: CGF-2025-00]
- All modules now report to the trust system [Amendment-ID: CGF-2025-00]
- All tests can now bind to specific behavior versions [Amendment-ID: CGF-2025-00]

### Migration
- [Migration Guide for 6.3.2](/codex/migrations/6.3.2.md)
