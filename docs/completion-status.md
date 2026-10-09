# QuickCart completion status 9 October 2026

## Completed and checked

- PostgreSQL technical report (12-page PDF), editable Word report and proposal.
- 16-slide editable presentation with speaker notes and demo steps.
- Current PostgreSQL runtime architecture diagram.
- Corrected GABAY/README to separate host Vite development and Docker production.
- Read-only PowerShell runtime verifier and ten-minute demonstration runbook.
- Rollback numeric-tag validation and all-six-image existence checks.
- Smoke checks for proxy, frontend, all APIs and a catalog query.
- All 76 API tests passed: catalog 20, orders 39, payment 17.
- Frontend lint and production build passed.
- Four Compose configurations validated without starting services.
- Verification PowerShell script parsed without syntax errors.
- PDF pages and slides visually reviewed; slide package/layout/import checks passed.

## Pending

Docker named-pipe access is denied from the assistant environment. No containers or
Jenkins jobs were started here. Run the commands below in your normal PowerShell.
Afterward configure Jenkins plugins, SCM job and quickcart-env credentials using the
real repository. Capture genuine automatic-trigger, failing-test, persistence and
rollback evidence using docs/demo-runbook.md. Group name, section, repository URL
and actual five-member contribution links are still required.

Word layout could not be rendered because the document renderer's LibreOffice
executable is unavailable. The independently generated PDF was rendered and checked.
Review the editable Word layout in Word before using it as the final PDF source.

The original instructor guidelines were not edited. Original project documents and
changed text files were backed up in the task work/originals folder. The provided
ZIP is an updated source snapshot; it excludes dependencies, build folders, .env,
certificates and Git internals. It contains the report, proposal and slides in docs.

## Start and verify on the Docker host

Stop an existing Vite dev server with Ctrl+C first. Use PowerShell 7:

```powershell
cd "C:\Users\Kenta\Downloads\QuickCart-PostgreSQL 1\quickcart"
npm.cmd run repair:env
docker compose up -d --build --wait --wait-timeout 240
npm.cmd run jenkins
npm.cmd run verify
```

Keep .env private and retain the database volume. Do not use down -v.
The app is http://localhost:8080 and Jenkins is http://localhost:8081.


## Delivery tracking update

Added persistent estimated arrival windows, delivery timeline, illustrated sample route, demo status progression, and customer receipt confirmation. See docs/delivery-tracking.md. Orders API now has 55 passing tests, including 16 new tracking tests; frontend lint/build and Compose validation passed. Live Docker migration and end-to-end checks remain pending because this session cannot access the Docker named pipe. The sample route is simulated, not live GPS.
