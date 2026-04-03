create table if not exists custody_membership (
  discord_user_id text primary key,
  status text not null,
  policy_version integer not null,
  changed_at_ms bigint not null,
  source_event_id text not null
);

create table if not exists custody_keys (
  key_id text primary key,
  discord_user_id text not null,
  public_key_b64 text not null,
  registered_at_ms bigint not null,
  revoked_at_ms bigint,
  policy_version integer not null
);

create table if not exists custody_sessions (
  session_id text primary key,
  scope text not null,
  created_at_ms bigint not null,
  expires_at_ms bigint not null,
  required_threshold integer not null,
  policy_version integer not null,
  canonical_payload_hash text not null,
  canonical_payload jsonb not null,
  status text not null
);

create table if not exists custody_session_approvals (
  approval_id text primary key,
  session_id text not null references custody_sessions(session_id) on delete cascade,
  signer_discord_user_id text not null,
  signer_key_id text not null,
  signature_b64 text not null,
  approved_at_ms bigint not null,
  policy_version integer not null
);

create table if not exists custody_audit_log (
  entry_id text primary key,
  occurred_at_ms bigint not null,
  event_type text not null,
  entity_id text not null,
  actor text,
  data jsonb not null,
  previous_hash text not null,
  entry_hash text not null
);

create table if not exists sealed_kits (
  version integer primary key,
  ciphertext_b64 text not null,
  metadata jsonb not null,
  updated_at_ms bigint not null
);
