# Documentation Structure

This directory follows a documentation partition model:

- `checkpoints/` - operational state snapshots and sprint execution context
- `reference/` - persistent doctrine documents
- `implementation-notes/` - future implementation notes and decision records

Checkpoints define active execution posture for the current sprint.

Doctrine in `docs/reference/` is persistent and authoritative.

Future implementation notes must not silently override doctrine; any divergence must be explicit and justified.
