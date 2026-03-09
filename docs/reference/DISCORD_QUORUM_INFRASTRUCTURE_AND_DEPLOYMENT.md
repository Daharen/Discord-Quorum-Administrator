# DISCORD QUORUM INFRASTRUCTURE AND DEPLOYMENT

## 1. Infrastructure Baseline
1. Runtime services are container-separated.
2. Initial runtime set: custody-api, guildbot, custody-portal, postgres.
3. Configuration remains environment-based.

## 2. Repository Structure Mandate
Repository starts with deterministic scaffolding and component ownership boundaries before service implementation.
