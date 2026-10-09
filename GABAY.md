# QuickCart gabay sa PostgreSQL

Ang database ay PostgreSQL 16.6. SQL ang query language. React/Vite ang frontend,
Node.js/Express ang backend, at Jenkins ang CI/CD automation.

## Local development

Buksan ang Docker Desktop. Gumamit ng Node.js 22.12+ o 24.

```powershell
npm.cmd run install:frontend
npm.cmd run dev
```

Vite: http://localhost:8080. Docker gateway: http://127.0.0.1:8082.
Ang npm run dev ay nagsisimula at nagve-verify muna ng Docker backend bago Vite.
Hiwalay pa rin ang Jenkins: npm.cmd run jenkins.

## Production demo

I-stop muna ang host Vite gamit ang Ctrl+C.

```powershell
npm.cmd run repair:env
docker compose up -d --build --wait --wait-timeout 240
npm.cmd run jenkins
npm.cmd run verify
```

App: http://localhost:8080. Jenkins: http://localhost:8081.
Magkahiwalay ang app at Jenkins Compose files, ayon sa SYSIN guidelines.
Huwag baguhin ang existing database password pagkatapos ma-initialize ang volume.

## Jenkins setup

1. Unlock Jenkins at gumawa ng admin account.
2. Install suggested plugins at GitHub at Docker Pipeline.
3. Add Secret file credential na quickcart-env gamit ang current PostgreSQL .env.
4. Create Pipeline from SCM para sa shared repository, branch main, Script Path Jenkinsfile.
5. First build registers the webhook/Poll SCM triggers.
6. Create separate rollback Pipeline from SCM, Script Path Jenkinsfile.rollback.
7. Push a visible change and show automatic build without clicking Build Now.

## Required live evidence

Sundin docs/demo-runbook.md para sa automatic deployment, failing-test gate,
persistence at rollback. Capture genuine screenshots. Lahat ng limang members
ay kailangang may sariling meaningful commits at maintindihan ang buong system.

## Data at credentials

PostgreSQL uses pg-data, internal port 5432, and DB_USER/DB_PASSWORD.
Wala nang DB_ROOT_PASSWORD. Old MySQL records are not automatically migrated.
Never use docker compose down -v for the persistence demo: it deletes data.
Never commit .env or put credentials in screenshots.

## Dokumentasyon

See README.md, docs/SYSIN-checklist.md, and the updated PostgreSQL report.
Jenkins setup and live demonstrations must be completed on the accessible Docker host.
