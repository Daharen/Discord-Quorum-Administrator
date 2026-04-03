# GuildBot (Phase 0 Minimal Governance Kernel)

GuildBot is the sole operational authority for privileged Discord actions. This implementation provides a deterministic Phase 0 governance loop with signed events and local audit logging.

## Current scope

- Minimal Discord runtime with governance-only command routing.
- Deterministic in-memory proposal lifecycle orchestration.
- Immutable first-write-wins voting.
- Deterministic quorum evaluation.
- Canonical signed governance event emission.
- Append-only local governance audit log.
- No-op custody sync publisher interface (architecture preserved, no networking).

## Supported commands

- `!propose admin_add <discordUserId>`
- `!propose admin_remove <discordUserId>`
- `!vote <proposalId> yes`
- `!vote <proposalId> no`
- `!proposal <proposalId>`
- `!proposals`
- `!expire`

## Current persistence model

- Governance state is in-memory only for this sprint (`ProposalStore`, `VoteRegistry`).

## Current audit model

- Local append-only NDJSON file at `runtime/audit/governance.ndjson`.
- Each entry stores sequence, timestamp, event hash, previous record hash, and the signed event.

## Deferred items

- Real Discord role mutation for admin promotion/removal.
- Custody API networking and external publishing.
- Durable storage (e.g., Postgres) for proposals and votes.
