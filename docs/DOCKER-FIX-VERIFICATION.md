# Current startup verification

Verified locally on 11 October 2026 for this package:

- npm run dev displays the regular frontend@1.0.0 / vite output and Local: http://localhost:8080/.
- Vite homepage, product listing, and all three API health routes returned HTTP 200.
- Stopping this installation's Docker proxy caused Vite to exit. The proxy was then restarted.
- Unavailable Docker is rejected before a Vite URL is advertised.
- Existing Docker PostgreSQL data survived the passwordless conversion and rebuild: 30 products and 2 orders in the isolated test installation.
- The PostgreSQL application role has no saved password, and generated .env has no DB_PASSWORD.
- No application .cjs files remain; scripts and references use .js.
- All 10 startup tests passed.
- Docker test builds passed: catalog 20 tests, order 55 tests plus PostgreSQL integration, payment 17 tests, and frontend lint.
- The frontend production build passed.

These results supersede older startup/password instructions in the historical project reports. Read START-HERE.md for the current commands. No second physical laptop was available; a separate clean extraction is used for portability testing.

Final checks: a separate clean ZIP extraction successfully created its own Docker project and passwordless database, with all six containers healthy. With localhost:8080 deliberately occupied, Vite automatically selected localhost:8081 and returned HTTP 200.


Revision 2: predev and predev:https are restored using .js. Verified automatic installation of 140 frontend packages when node_modules is absent, Docker startup, Vite on the next free port 8081, page/API HTTP 200, 10 startup tests, and frontend lint. Dependency versions and all five lockfiles match the original ZIP. See GUIDELINES-AUDIT.md for the full original-package and Word-guidelines review.

