# Operational Engine Foundation

This directory is reserved for the new operational layer above the canonical Guru system.

It is intentionally not imported by `main-dashboard.html` or any production page yet.

Module boundaries:

- `adapters/`: read and normalize legacy authoritative evidence
- `standards/`: expected operational conditions and policies
- `findings/`: deviation detection and deduplication
- `verification/`: evidence review and exceptions
- `actions/`: owners, due dates, and follow-up workflow
- `evaluation/`: post-action evidence evaluation
- `audit/`: immutable operational event/audit contracts
- `observations/`: manager/supervisor observation contracts
- `coaching/`: coaching plan contracts
- `escalation/`: Manager → Supervisor → Director policy

See `docs/OPS_DATA_ADAPTERS.md`. No production behavior is implemented here in this phase.
