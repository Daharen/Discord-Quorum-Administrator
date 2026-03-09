# CHECKPOINT_v1

## 1.0 Commit Identity

### 1.1 Commit title
`chore(init): establish repository scaffold and doctrine baseline`

### 1.2 Commit scope
Sprint Step 1 only.

### 1.3 Commit objective
Create the deterministic repository skeleton, persist checkpoint and doctrine documents inside the repository, define component boundaries, and prepare the codebase for implementation without introducing governance logic, service logic, or framework lock-in.

## 2.0 Constraints

1. Do not implement quorum logic.
2. Do not implement Discord API integrations.
3. Do not implement custody sessions, signing flows, or recovery procedures.
4. Do not choose application frameworks beyond minimum boundary anchoring.
5. Preserve governance separation: GuildBot (operations), Custody API (custody authority), Crypto Core (cryptographic determinism).

## 3.0 Repository Structure Mandate

### Root
- `README.md`
- `.gitignore`
- `.editorconfig`
- `.env.example`

### Documentation
- `docs/README.md`
- `docs/checkpoints/CHECKPOINT_v1.md`
- `docs/reference/*.md`

### Infrastructure
- `infra/README.md`
- `infra/compose/.gitkeep`
- `infra/postgres/.gitkeep`

### Source
- `src/README.md`
- `src/crypto-core/README.md`
- `src/guildbot/README.md`
- `src/custody-api/README.md`
- `src/custody-portal/README.md`

## 4.0 Acceptance Criteria

1. Required top-level directories exist.
2. Checkpoint is versioned in repository documentation.
3. Doctrine documents exist under `docs/reference/`.
4. Every component directory has a boundary-defining README.
5. Root README remains architectural and implementation-neutral.
6. No governance/service logic has been introduced.
7. Repository remains clean for Commit 2.
