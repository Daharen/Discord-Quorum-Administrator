DISCORD_QUORUM_CUSTODY_ARCHITECTURE.md

────────────────────────────────────────────────────────

1.0 Document Purpose

1.1 This document defines the architecture of the custody system used by the Discord Quorum Administrator project.

1.2 The custody system governs access to platform-root credentials and infrastructure ownership points that cannot be controlled directly by Discord bot permissions.

1.3 The custody architecture exists to ensure that access to critical infrastructure is controlled by quorum authorization rather than individual possession of credentials.

1.4 This document defines the custody system’s structure, responsibilities, security model, and operational procedures.

1.5 This document is a persistent architectural reference and must be treated as a stable system doctrine.

────────────────────────────────────────────────────────

2.0 Custody System Objective

2.1 The custody system exists to control access to infrastructure accounts that represent platform-root authority.

2.2 Platform-root accounts include but are not limited to:

2.2.1 Discord server owner account
2.2.2 Organization email account used for the Discord owner
2.2.3 GitHub organization ownership
2.2.4 Infrastructure hosting accounts
2.2.5 Any other credential capable of overriding governance controls

2.3 The custody system ensures that no individual administrator possesses independent access to these accounts.

2.4 All access to custody-controlled accounts must require quorum authorization.

────────────────────────────────────────────────────────

3.0 Custody System Components

3.1 The custody architecture consists of four interacting components.

3.2 GuildBot

3.2.1 GuildBot is the governance bot operating inside the Discord server.

3.2.2 GuildBot maintains the authoritative administrator role within the server.

3.2.3 GuildBot acts as the membership oracle for the custody system by reporting administrator changes.

3.2.4 GuildBot emits signed governance events to the custody API when administrator membership changes occur.

3.3 Custody API

3.3.1 The Custody API is the external governance and custody control service.

3.3.2 The Custody API maintains the canonical registry of administrators derived from GuildBot governance events.

3.3.3 The Custody API manages quorum signing sessions required for custody actions.

3.3.4 The Custody API stores encrypted recovery materials.

3.3.5 The Custody API enforces policy rules governing the release of those materials.

3.4 Crypto Core

3.4.1 Crypto Core provides deterministic cryptographic primitives shared by the bot, custody API, and portal.

3.4.2 Crypto Core defines canonical message formats and signing envelopes.

3.4.3 Crypto Core ensures that all cryptographic verification is deterministic and reproducible.

3.5 Custody Portal

3.5.1 The Custody Portal provides the human interface for interacting with the custody system.

3.5.2 Custodians use the portal to register signing keys, approve sessions, and participate in recovery ceremonies.

3.5.3 The portal does not possess custody secrets.

────────────────────────────────────────────────────────

4.0 Custodian Membership Model

4.1 Custodians are derived directly from the administrator role within the Discord server.

4.2 When GuildBot promotes a user to administrator, the custody system enrolls that user as a custodian.

4.3 When GuildBot removes an administrator, the custody system removes that user from the custodian registry.

4.4 Custodian membership is therefore automatically synchronized with governance state.

4.5 Custodian membership changes trigger custody policy updates.

────────────────────────────────────────────────────────

5.0 Cryptographic Authorization Model

5.1 Custodian participation in governance is implemented through threshold signing.

5.2 Each custodian registers a public signing key with the custody system.

5.3 Custodians authorize actions by signing canonical decision payloads.

5.4 A quorum action becomes authorized when the number of valid signatures meets the configured threshold.

5.5 The custody API verifies signatures deterministically using Crypto Core canonicalization rules.

────────────────────────────────────────────────────────

6.0 Threshold Policy

6.1 Custody actions require threshold approval from the current administrator set.

6.2 The threshold value may be configurable but must represent a quorum rather than a simple unilateral authorization.

6.3 The threshold policy must be enforceable independent of individual cooperation.

6.4 The threshold must be recomputed whenever administrator membership changes.

────────────────────────────────────────────────────────

7.0 Custody Secrets Model

7.1 Custody-controlled credentials are never stored in plaintext.

7.2 All recovery materials are stored as encrypted sealed kits.

7.3 The sealed kit contains all information required to recover custody-controlled accounts.

7.4 The sealed kit is encrypted using a data encryption key.

7.5 The encryption key itself is protected by the custody system’s policy controls.

7.6 Plaintext recovery materials must only exist during an authorized recovery ceremony.

────────────────────────────────────────────────────────

8.0 Recovery Kit Contents

8.1 The recovery kit may include the following materials:

8.1.1 Discord owner account login credentials
8.1.2 Discord backup recovery codes
8.1.3 Email account recovery credentials
8.1.4 GitHub organization recovery credentials
8.1.5 Infrastructure provider recovery credentials
8.1.6 Procedural documentation required for recovery

8.2 The recovery kit must remain sealed except during authorized recovery ceremonies.

────────────────────────────────────────────────────────

9.0 Recovery Ceremony Architecture

9.1 A recovery ceremony is a controlled procedure used to temporarily unlock recovery materials.

9.2 A recovery ceremony may only begin after quorum authorization.

9.3 The custody API creates a recovery session requiring threshold signatures from custodians.

9.4 Once quorum approval is achieved, the custody API releases the sealed recovery kit for a limited session window.

9.5 The recovery ceremony must occur within this session window.

────────────────────────────────────────────────────────

10.0 Recovery Ceremony Procedure

10.1 Recovery ceremonies follow a strict procedure.

10.2 Step 1: Session creation.

10.2.1 A quorum session is initiated through the custody system.

10.2.2 The session defines the scope and expiration time.

10.3 Step 2: Custodian approvals.

10.3.1 Custodians submit signatures authorizing the recovery session.

10.3.2 The custody API verifies signatures.

10.3.3 When the threshold is met, the session becomes authorized.

10.4 Step 3: Recovery kit reveal.

10.4.1 The sealed kit is decrypted for the ceremony session.

10.4.2 The plaintext kit becomes accessible only during the session window.

10.5 Step 4: Recovery operation.

10.5.1 Administrators perform the required recovery operation.

10.6 Step 5: Rotation.

10.6.1 All recovery credentials must be rotated immediately.

10.6.2 New credentials must be generated.

10.6.3 The updated kit must be resealed.

10.7 Step 6: Session closure.

10.7.1 The custody API seals the new kit.

10.7.2 The previous kit becomes permanently invalid.

────────────────────────────────────────────────────────

11.0 Rekey and Revocation Model

11.1 When an administrator is removed, the custody system must invalidate their ability to participate in future quorum actions.

11.2 Administrator removal triggers a custody policy update.

11.3 The custody system rotates relevant cryptographic keys where necessary.

11.4 Any session approvals involving removed administrators become invalid.

11.5 Rekeying ensures expelled custodians cannot contribute to quorum actions.

────────────────────────────────────────────────────────

12.0 Session Authorization Model

12.1 Each custody action is executed within a defined session.

12.2 A session contains:

12.2.1 session identifier
12.2.2 session scope
12.2.3 session expiration time
12.2.4 required threshold value
12.2.5 canonical payload hash

12.3 Custodians authorize sessions by signing the canonical payload.

12.4 The custody API records all approvals.

────────────────────────────────────────────────────────

13.0 Canonical Payload Structure

13.1 All custody decisions are represented by canonical payloads.

13.2 Payloads must include:

13.2.1 action type
13.2.2 session identifier
13.2.3 timestamp
13.2.4 nonce
13.2.5 payload data
13.2.6 policy version

13.3 Payload canonicalization must be deterministic.

13.4 All signatures must verify against the canonical representation.

────────────────────────────────────────────────────────

14.0 Audit Logging

14.1 All custody system activity must be logged.

14.2 Audit logs must include:

14.2.1 governance events from GuildBot
14.2.2 custodian key registrations
14.2.3 session creation
14.2.4 approval signatures
14.2.5 recovery ceremonies
14.2.6 rekey operations

14.3 The audit log must be append-only.

14.4 The audit log must be tamper-evident.

────────────────────────────────────────────────────────

15.0 Bot–Custody Synchronization

15.1 GuildBot and the custody API must remain synchronized.

15.2 GuildBot reports administrator membership changes to the custody API.

15.3 The custody API periodically verifies administrator membership with GuildBot.

15.4 Any detected divergence must be corrected automatically.

────────────────────────────────────────────────────────

16.0 Failure Containment Principle

16.1 Compromise of the Discord bot must not expose custody secrets.

16.2 Compromise of the custody portal must not expose custody secrets.

16.3 Compromise of a single custodian must not grant custody access.

16.4 Compromise of fewer than quorum custodians must not grant custody access.

────────────────────────────────────────────────────────

17.0 Security Boundaries

17.1 GuildBot never stores recovery kits.

17.2 Custody Portal never stores recovery kits.

17.3 Recovery kits are stored only in encrypted form by the custody API.

17.4 Plaintext recovery materials must only exist during recovery ceremonies.

────────────────────────────────────────────────────────

18.0 Custody System Boundaries

18.1 The custody system governs access to platform-root accounts.

18.2 The custody system does not control routine Discord governance operations.

18.3 Routine governance remains under GuildBot control.

18.4 Custody procedures are invoked only for recovery-level operations.

────────────────────────────────────────────────────────

19.0 Long-Term Maintainability

19.1 The custody architecture must remain understandable and maintainable across leadership turnover.

19.2 Cryptographic primitives must use widely supported algorithms.

19.3 Custody system components must remain replaceable without violating governance invariants.

────────────────────────────────────────────────────────

20.0 Summary

20.1 The custody system ensures that platform-root credentials are governed by quorum rather than individuals.

20.2 Custodian membership is derived directly from Discord administrator roles.

20.3 Recovery materials remain sealed except during controlled recovery ceremonies.

20.4 All custody operations require cryptographic quorum authorization.

20.5 The custody architecture enables institutional continuity independent of individual participants.

────────────────────────────────────────────────────────

End Document.