# Custody API

Deterministic custody authority service for membership synchronization, key registration, quorum sessions, and append-only audit logging.

## Endpoints

- `GET /health`
- `POST /bot/events`
- `POST /keys/register`
- `POST /sessions/create`
- `POST /sessions/:sessionId/approve`
- `GET /sessions/:sessionId`
- `GET /audit`

## Constraints

- No plaintext recovery kit reveal endpoint.
- No direct Discord governance operations.
- GuildBot governance events must be signed and verified.
