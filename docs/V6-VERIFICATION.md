# QuickCart v6 verification — 11 October 2026

Based on the supplied QuickCart-Vite-v5.zip. Existing dependency versions, all
five package-lock files, API business logic, Jenkinsfile, rollback pipeline,
Docker services, tests, logo and footer changes are retained. No .cjs source
files were introduced; installed third-party dependencies may use .cjs internally.

Changes:

- Missing Docker images build on first setup. Later starts inspect/reuse images
  with --no-build --pull never. Running/Healthy progress is hidden on cached
  starts; readiness checks, automatic startup and failure diagnostics remain.
- npm run setup:dev explicitly rebuilds after backend/container source changes.
- Vite checks both IPv4/IPv6 listeners before choosing 8080 or the next available
  port. It accepts local/network connections while retaining same-origin APIs.
- API health interruptions display a reconnect screen without terminating Vite.
  Loss of Docker/the installation's gateway still terminates Vite after repeated
  runtime failures. Docker is mandatory before startup.
- npm run doctor checks the real selected port and APIs. No saved database
  password is introduced. Each fresh installation gets its own database identity.

Verified on the connected Windows laptop with Docker engine 29.8.0:

- Fresh directory, npm install, automatic missing-image setup, six healthy services.
- Subsequent npm run dev reused images/dependencies without another build/download.
- 18 startup/network tests passed: Docker-unavailable refusal, missing/cached image
  handling, IPv4/IPv6, occupied-port fallback and network HTTP responses.
- Docker test stages passed: catalog 20 tests, orders 55 tests plus PostgreSQL
  integration, payment 17 tests, and frontend lint. Production Vite build passed.
- Browser rendered the storefront. Three API health routes returned 200 locally
  and through the laptop's Wi-Fi address. A separate Docker network client also
  reached the website and all three health routes.
- Simulated checkout and order readback succeeded. The order survived restarting
  the order API container.
- Stopping the catalog API produced the reconnect screen while Vite remained up.
- Stopping this installation's proxy caused Vite to exit after repeated checks.

These tests used one physical Windows laptop and a Docker network client. Other
physical laptops, operating systems, and networks were not available for direct
verification. The first setup needs working Docker, supported Node.js and Internet.
This is not a guarantee against every machine, network, or Docker installation
problem. The live Jenkins/GitHub demonstration remains a separate project step.

Follow ../START-HERE.md. Preserve .env for an existing installation; distribute
the clean ZIP for new installations.
