# Guidelines and original package audit

Reviewed the full supplied SYSIN Final Project Guidelines, including its requirements, implementation phases, deliverables, live demo, rubric, both examples, and proposal appendix. The document provides project requirements; it is not authorization to publish a repository or change Jenkins credentials.

## What is preserved from the original ZIP

- Every original file has a corresponding file; 12 JavaScript files were renamed from .cjs/.mjs to .js.
- All dependencies and devDependencies in all five package.json files are unchanged.
- All five package-lock.json files match the original ZIP byte for byte. Third-party packages may internally use .cjs files; their package metadata must retain those original paths.
- All shop screens, product images, catalog behavior, cart, checkout, payment simulation, order history, delivery tracking, support, schemas, and seed data remain.
- The six application-stack services remain: proxy, frontend, catalog-api, order-api, payment-api, and db.
- Dockerfiles, module .dockerignore files, test targets, health checks, service dependencies, restart policies, two private networks, and the persistent PostgreSQL named volume remain.
- Jenkinsfile, Jenkinsfile.rollback, Jenkins Docker setup, plugins, its persistent volume, push/Poll SCM triggers, build-number tags, credentials binding, test gate, smoke tests, and post actions remain.
- The original reports, proposal, slides, diagrams, and demonstration documents remain.

## Startup correction in this revision

The earlier revision required npm install before a first npm run dev because its predev hook had been removed. This revision restores predev and predev:https using .js filenames:

    node scripts/prepare-dev.js && node scripts/ensure-frontend.js

npm run dev first checks and starts Docker services, waits for their health checks, installs missing frontend dependencies, then starts Vite. npm install still installs the frontend dependencies as before. Vite starts at localhost:8080 and selects the next free port automatically. The Docker watchdog remains active while Vite runs.

The deliberate password change remains: local startup does not save or ask for a database password. Older databases belonging to this installation are converted to passwordless access on the private Docker network. Database ports remain unpublished. This is the user-requested local demo configuration; the guidelines' credential-based deployment examples are not a claim that the local demo uses a database password.

## Guidelines mapping and limits

| Requirement | Evidence/status |
| --- | --- |
| At least 3 application modules in containers | Four application modules plus proxy and PostgreSQL are retained; the full Docker-served stack is available through npm start. |
| Single public application proxy | Docker publishes only the proxy. Host Vite is a development convenience; use the Docker-served proxy for the final architecture demonstration. |
| Database reads/writes and persistence | Existing schema, transactions, checkout, tracking, named volume, and database integration tests retained. |
| Automated backend tests and health routes | Three backend test suites and health endpoints retained. |
| Docker test stages and failure gate | Retained in all application Dockerfiles and Jenkinsfile. |
| Jenkins in a separate container and Compose project | Retained. Start separately with npm run jenkins; npm run dev did not start Jenkins in the original ZIP either. |
| Automatic deployment on a Git push | Trigger declarations retained. Requires a configured repository and Jenkins job; a live push-triggered pipeline was not demonstrated in this audit. |
| Build tags, smoke tests, and rollback | Original Jenkins and rollback files preserved byte for byte. |
| Secrets outside Git | .env remains ignored; no local database password is shipped. Jenkins Credentials integration remains in the pipeline. |
| Reports, slides, diagrams | Original files retained. Their old startup/password examples should be read together with START-HERE.md and this audit. |
| Team commits, presentation, live failed-test demonstration, and rollback proof | These require the team's repository and live demonstration; not certified by a successful local startup. |

## Verification

The preceding runtime checks passed: six Docker services healthy, Vite and API requests HTTP 200, Docker loss stops Vite, 8080 occupied causes Vite to select 8081, 10 startup checks, 92 backend unit tests, PostgreSQL integration, frontend lint, and production build. This revision additionally tests npm run dev from a folder with no frontend/node_modules to verify automatic dependency installation is restored.

Revision verification passed: npm run dev from the clean extraction installed 140 missing frontend packages automatically, started all Docker services, then launched Vite. With 8080 already occupied, Vite selected 8081. The page and all three API health endpoints returned HTTP 200. All 10 startup tests and frontend lint also passed after restoring the hooks.

