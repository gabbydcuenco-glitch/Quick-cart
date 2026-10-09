# QuickCart

A multi-container e-commerce checkout system with React/Vite, PostgreSQL and Jenkins.

## Run locally

Open Docker Desktop and use Node.js 22.12+ or Node.js 24. From this folder:

```powershell
npm.cmd run install:frontend
npm.cmd run dev
```

npm run dev first starts and verifies Docker services, then launches Vite at
http://localhost:8080. The backend setup generates a database password
only if missing, writes UTF-8 .env without BOM, builds containers and verifies backend
health and products. Vite forwards /api to the Docker proxy at 127.0.0.1:8082.
A startup error stops setup before launching Vite. Keep the same .env after first startup.

## PostgreSQL

PostgreSQL 16 uses the new pg-data named volume. Its schema and nine sample products
are initialized by db/init.sql. The catalog and order APIs use pg, parameterized queries,
RETURNING, identity IDs and transactions. Checkout decrements stock conditionally and
rolls back database writes if any item is unavailable. Customer creation uses an upsert.

The previous MySQL db-data volume is preserved. Its records are not automatically
imported into PostgreSQL. Do not use MySQL image tags for rollback after this migration.
DB_ROOT_PASSWORD is obsolete; .env needs DB_USER and DB_PASSWORD only.

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

Production exposes only the proxy on 8080. The local host override exposes it only
on 127.0.0.1:8082 so host Vite can use 8080. Database and APIs publish no host ports.
Catalog/order APIs join frontend-net and backend-net; PostgreSQL joins backend-net.
Each application has its own Dockerfile and health check; Compose waits for dependencies.

## Production and Jenkins

Stop local Vite with Ctrl+C before production deployment:

```powershell
docker compose up -d --build --wait --wait-timeout 240
npm.cmd run jenkins
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Application: http://localhost:8080. Jenkins: http://localhost:8081.
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

Run `npm.cmd run dev` to start Vite directly in the current terminal at http://localhost:8080. Keep that terminal open. This command does not rebuild Docker, download images, install dependencies, or reuse a different Vite process. Start only one Vite terminal; Ctrl+C stops it.

Docker must already be running. First setup or after backend/Docker changes: run `npm.cmd run setup:dev`. To start existing stopped images without rebuilding, run `node scripts/prepare-dev.cjs`. Install frontend dependencies once with `npm.cmd run install:frontend`.
