> Updated startup instructions: read [START-HERE.md](START-HERE.md). Installation ports are automatic; older fixed-port examples below may differ.

> v8: [Portable startup](START-HERE.md) and [current changes](docs/V8-VERIFICATION.md). Each laptop uses its own local Docker installation. Later starts reuse images and dependencies. Tests and health checks remain available.

# QuickCart

A multi-container e-commerce checkout system with React/Vite, PostgreSQL and Jenkins.

Latest gift catalog and peso update: see docs/gifts-peso-update.md.
The shop contains all 30 items from the supplied gift list and six new Couples sets.

## Run locally

See [START-HERE.md](START-HERE.md) for current setup. With Docker Desktop running and Node.js 22.12 or newer installed:

    npm install
    npm run dev

Docker services start first, then Vite prints its Local URL (normally http://localhost:8080/). No saved database password is needed. Keep the Vite terminal and Docker engine running.

## PostgreSQL

PostgreSQL 16 uses the new pg-data named volume. Its schema and nine legacy sample products
are initialized by db/init.sql. Before accepting traffic, catalog-api migrates the catalog
to PHP and adds 30 document gifts plus six Couples sets, for 45 products on a fresh database. The catalog and order APIs use pg, parameterized queries,
RETURNING, identity IDs and transactions. Checkout decrements stock conditionally and
rolls back database writes if any item is unavailable. Customer creation uses an upsert.

The previous MySQL db-data volume is preserved. Its records are not automatically
imported into PostgreSQL. Do not use MySQL image tags for rollback after this migration.
Database passwords are not used by this local Docker demo. The database has no published host port; only its private Docker network can reach it.

```powershell
npm.cmd run db
```

## Containers and networking

| Service | Role | Internal port |
|---|---|---|
| frontend | Vite-built React UI, served by unprivileged Nginx | 8080 |
| catalog-api | Product list, search and categories | 3001 |
| order-api | Quotes, checkout, order history and support | 3002 |
| payment-api | Simulated payments | 3003 |
| db | PostgreSQL 16 with named volume pg-data | 5432 |
| proxy | Single public application gateway | 8080 |

Only the proxy publishes a host port, chosen automatically from 8082. Vite uses 8080 (or the next free port). Database and APIs publish no host ports. Catalog/order APIs join frontend-net and backend-net; PostgreSQL joins backend-net.
Each application has its own Dockerfile and health check; Compose waits for dependencies.

## Production and Jenkins

For the Docker-served application and Jenkins:

```powershell
npm start
npm.cmd run jenkins
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Application: use the URL printed by npm start. Jenkins: http://localhost:8081.
Jenkins uses a separate Compose project and persistent home. It has the host Docker
socket for this classroom setup. Install suggested plugins, GitHub and Docker Pipeline.
Create quickcart-env as a Secret file credential using the current PostgreSQL .env.
Create a Pipeline from SCM for your shared repository/main branch with Jenkinsfile.
Run it once to register triggers, then use the GitHub webhook or included Poll SCM.
Push-triggered deployment still requires the shared repository URL and Jenkins setup.

Pipeline: Checkout -> Test -> Build Images -> Deploy -> Smoke Test. Tests run before
deployment. Images use Jenkins build numbers; post steps report the result and remove
.env from the Jenkins workspace. The rollback job uses Jenkinsfile.rollback.
Only roll back to a successful PostgreSQL build with a compatible schema.

## Checks

```powershell
npm.cmd test
docker compose -f docker-compose.yml -f docker-compose.host.yml ps
Invoke-RestMethod http://localhost:8080/api/catalog/health
Invoke-RestMethod http://localhost:8080/api/orders/health
Invoke-RestMethod http://localhost:8080/api/payment/health
```

The migration was tested against a local PostgreSQL-compatible PGlite runtime:
schema/seed, nine products, seeded history, order creation/readback, money totals,
stock updates, address saving, existing customer, failed-order rollback, support ticket
and activity log, and health queries all passed. This validates SQL/repository behavior;
Docker networking, authentication and Jenkins runtime remain unverified in the assistant
session because Docker access is restricted. Verify on the user's Docker Desktop.

## Optional HTTPS

```powershell
npm.cmd run https:setup
npm.cmd run dev:https
```

The PowerShell 7 certificate script trusts a localhost server certificate for the current
Windows user. .certs is ignored by Git and Docker builds. Default npm run dev uses HTTP.

## Stop and persistence

```powershell
docker compose -f docker-compose.yml -f docker-compose.host.yml down
docker compose -p quickcart-jenkins -f infra/jenkins/docker-compose.yml down
```

Volumes persist. To prove persistence, create an order, restart the stack and find it
again. Do not add -v, which deletes the project's database volume.

## Team

| Member | Role |
|---|---|
| Cinense, Kyle Mathew T. | DevOps and Project Manager |
| Cuenco, John Gabrielle D. | Frontend Lead |
| Dayrit, Shaira Benneth M. | QA, Documentation and Presentation |
| Frayre, Angeline B. | Database and Orchestration Lead |
| Perez, Jan Andre T. | Backend Microservice Lead |

## Updated submission materials

The technical Word report, 12-page technical PDF and proposal in docs now describe
PostgreSQL. The runtime architecture PNG is updated. Use docs/demo-runbook.md for
live demonstrations and scripts/Verify-QuickCart.ps1 (npm run verify) for read-only
runtime checks. GABAY.md now matches the real Vite and Docker startup commands.

Verified on 9 October 2026: catalog 20, orders 39 and payment 17 Jest tests passed;
frontend ESLint and the production Vite build passed. All four Compose configurations
passed syntax/configuration validation. These checks do not prove running Docker
containers, actual PostgreSQL authentication or Jenkins execution.

Jenkins setup, real push-triggered builds, failed-test/persistence/rollback screenshots,
repository URL and contribution evidence remain required. Update documentation and
slides with those genuine results before submission. The original instructor
requirements have not been changed.


## Delivery tracking update

Added persistent estimated arrival windows, delivery timeline, illustrated sample route, demo status progression, and customer receipt confirmation. See docs/delivery-tracking.md. Orders API now has 55 passing tests, including 16 new tracking tests; frontend lint/build and Compose validation passed. Live Docker migration and end-to-end checks remain pending because this session cannot access the Docker named pipe. The sample route is simulated, not live GPS.


## Current verification and Jenkins setup

See docs/completion-status.md for the latest verified results and pending Docker/GitHub checks. Jenkins setup after repository upload is in docs/jenkins-next-steps.md. Run scripts/Finish-QuickCart-Local-Checks.ps1 from normal PowerShell to rebuild the delivery fix and verify restart persistence.


## Daily development startup

Run npm run dev. It starts the Docker services and then Vite in the terminal, normally at http://localhost:8080/. Missing frontend dependencies are installed automatically. Docker must stay running. No database password is saved or requested.



## Original package and guidelines audit

See [docs/GUIDELINES-AUDIT.md](docs/GUIDELINES-AUDIT.md). All dependency versions, lockfiles, application features, and Jenkins/rollback pipeline files are preserved. npm run dev automatically installs missing frontend dependencies before launching Vite. Jenkins starts separately with npm run jenkins.

