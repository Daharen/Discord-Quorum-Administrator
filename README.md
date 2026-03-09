# Discord Quorum Administrator

Discord Quorum Administrator is a deterministic quorum-governed Discord administration system designed to remain compliant with Discord Terms of Service.

This repository is in architectural bootstrapping phase and currently establishes governance doctrine, component boundaries, and deterministic scaffolding before service implementation.

Privileged Discord operations are executed by GuildBot after quorum approval; platform-root recovery authority is governed separately by Custody API through threshold authorization.

## Primary Components

1. GuildBot
2. Custody API
3. Crypto Core
4. Custody Portal

## Repository Status

Architectural bootstrapping.

## Current Phase

See checkpoint state and sprint execution context in `docs/checkpoints/CHECKPOINT_v1.md`.

## Authoritative Documents

Persistent doctrine is maintained under `docs/reference/`.

## Execution Rule

Any architectural change must cite the governing checkpoint and/or doctrine documents.

## Initial Repository Layout

- `docs/` - checkpoint and doctrine baseline
- `infra/` - infrastructure placeholders and future deployment artifacts
- `src/` - component-owned implementation boundaries
