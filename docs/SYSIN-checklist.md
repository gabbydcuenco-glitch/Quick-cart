# SYSIN completion checklist

## Implemented in source

- React/Vite frontend and three Node.js/Express APIs with their own Dockerfiles.
- PostgreSQL 16.6, seven SQL tables (including delivery_events), parameterized queries and checkout transactions.
- Production gateway on 8080; private APIs/database; two networks; pg-data persistence.
- Health checks, healthy dependencies, restart policies, .dockerignore and .env.example.
- Separate Jenkins Docker Compose stack on 8081 with jenkins_home persistence.
- Declarative Checkout, Test, Build Images, Deploy and Smoke Test stages.
- Webhook/Poll SCM, numbered tags, credentials binding and post cleanup.
- Rollback validates a numeric tag and all six images before deployment.
- Updated startup guide and runtime verification/demo scripts.

## Runtime and submission evidence still required

- [ ] Containers healthy and browser checkout writes to PostgreSQL.
- [x] Local Jenkins plugins installed and quickcart-env credential configured.
- [ ] GitHub SCM jobs configured after repository upload.
- [ ] Push automatically starts a build without clicking Build Now.
- [ ] Tests pass in Docker; a failing test prevents deployment.
- [ ] Newly created order persists through redeployment/restart.
- [ ] Previous PostgreSQL image tag redeployed and visible footer verified.
- [ ] Genuine screenshots inserted into technical report and slides.
- [ ] Group name, course section and real repository URL supplied.
- [ ] Technical PDF 8-15 pages and slides 12-20.
- [ ] Five members have meaningful commits; instructor has repository access.
- [ ] Ten minute presentation rehearsed twice and backup video recorded.

The assistant's Docker named-pipe access is denied. Source configuration and local
checks do not prove a successful Docker/Jenkins runtime demonstration.
Follow docs/demo-runbook.md on the Docker host and record actual results.

## Verification on 9 October 2026

76 API tests passed (20 catalog, 39 orders, 17 payment), frontend lint and Vite
build passed, and production/host/dev/Jenkins Compose configurations passed.
The verification PowerShell script passed syntax parsing. Runtime checks remain pending.


Current detailed evidence and limitations: see completion-status.md. Both Jenkinsfiles now validate in Jenkins; local tests total 92 plus the PostgreSQL integration suite. Live status-update fix awaits container rebuild.
