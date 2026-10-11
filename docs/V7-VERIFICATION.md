# QuickCart v7 — independent local installations

This revision removes the network sharing added in v6. Each laptop runs its own
copy with its own Docker Desktop and Node.js. No common Wi-Fi or another laptop's
Docker is required. Internet is needed for first-time dependency/image setup.

- Vite binds only to 127.0.0.1, and prints only the Local URL.
- No Network URLs or network-sharing hint is printed.
- Default port remains 8080 with the next free port chosen automatically.
- Docker image/dependency reuse, mandatory Docker startup checks, all application
  features, API tests, Jenkins and rollback files remain unchanged.
- Runtime connection info and npm run doctor contain only local connection checks.

Verification: the updated startup tests check a loopback-only listener, no Network
output, occupied-port fallback, local HTTP access, and refusal when Docker is
unavailable. Existing v6 backend/runtime results remain in V6-VERIFICATION.md;
its LAN-access observations describe that older revision, not this revision.

Tests on one physical laptop cannot certify every other laptop's Docker/Node
installation. Share the clean ZIP, not .env or node_modules. Follow START-HERE.md
independently on each laptop.
