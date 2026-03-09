# DISCORD QUORUM CUSTODY ARCHITECTURE

## 1. Scope
Define custody boundaries and authorization responsibilities.

## 2. Component Roles
1. Custody API is the external custody and quorum authorization authority.
2. Custody API maintains canonical administrator registry derived from GuildBot events.
3. Custody API manages sessions, key registrations, encrypted recovery kits, and custody policy enforcement.
4. Custody Portal is the human interface for registration, approvals, and audit visibility.
5. Custody Portal does not store recovery secrets.

## 3. Separation Invariant
Routine Discord governance remains in GuildBot and must not be absorbed into custody surfaces.
