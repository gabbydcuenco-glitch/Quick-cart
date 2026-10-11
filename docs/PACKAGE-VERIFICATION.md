# quickcarkfinal 1 verification — 10 October 2026

This source package contains all 30 products from the supplied Word document,
six additional Couples gift sets, and the original nine products (45 total).
It includes PHP pricing, delivery tracking, Men/Women/Unisex/Couples filters,
the cleaned footer, automatic frontend dependency setup, and Vite port fallback.
Saved Couples & Unisex category links now open Couples products.

Checks passed against this source:
- Catalog: 20 tests; orders: 55 tests; payment: 17 tests.
- PostgreSQL integration: delivery transitions and receipt confirmation.
- Gifts PostgreSQL integration: repeat migrations, 45 products, preserved stock,
  original USD orders, new PHP orders, quote totals, and legacy category links.
- Frontend lint and production build.
- Actual Vite startup: HTTP 200 for HTML/client, PHP and USD formatting.
  With port 8083 occupied, Vite successfully selected port 8084.
- The predev dependency check succeeds with dependencies already installed.

Read-only checks of the running installation at port 8082 passed: all three API
health endpoints, all 45 products, category filters, PHP prices, checkout quote.
No production orders or records were changed by those checks.

Direct Docker access was enabled and the previous installation's password
mismatch was repaired using its authenticated existing credentials. All six
QuickCart services then reported healthy and the live read-only checker passed.
This final version adds credential checks before container changes: it can
recover verified credentials from the running QuickCart database if .env is
missing, and rejects wrong credentials before recreating services. Eight startup
regression tests pass, including stale credentials and an existing stopped volume.
Three additional checks pass: root startup refusal with Docker unavailable,
direct Vite startup refusal, and backend health failure/recovery. The unavailable
Docker tests use an isolated nonexistent endpoint; they do not stop the real engine.
There are 11 startup checks in total, runnable with npm run test:startup after
installing frontend dependencies. Frontend lint and production build pass with
the new store availability screen. Store availability is checked every five seconds
after each health request completes, with a three-second request timeout.
The final source was built and started through npm run setup:dev successfully.
All six Docker services were healthy. npm run dev reused the running backend
and started Vite on port 8084 because 8083 was occupied.
The browser test stopped only the demo payment container briefly: the shop hid
its controls and showed the unavailable screen, then automatically returned to
the Women category with 10 products when the container was restarted. The cart
still contained its original two items. No orders were placed or deleted.
Jenkins job quickcart build #1 was inspected and reports SUCCESS, including Test,
Build Images, Deploy and Smoke Test. Its commit is 1414abedba36f9570c9b63ab455549f2ae46ffee,
which is still the GitHub main branch at the time of this check; it predates this
final package. A Jenkins build of this final source still requires uploading it
to GitHub. Build #1 was manual, so automatic Git triggering is not yet proven.
The rollback job exists but has no builds. No rollback was executed here.
The final smoke test was repaired to validate actual JSON product records instead
of a renamed product's old display name. It passed against the running Docker stack.
Delivery tracking remains a demo simulation, not live courier GPS.

Extract to a new folder. Keep the existing QuickCart database running for automatic
credential recovery; otherwise copy its working .env before setup.
From that extracted folder, run:

    npm.cmd install
    npm.cmd run setup:dev
    npm.cmd run dev

Open the Vite URL printed in the terminal. The first installation downloads
dependencies; later launches reuse them. Docker setup may download missing images.
The ZIP intentionally excludes credentials, node_modules and build output.

To recheck the running Docker gateway without changing data:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Check-QuickCart-Gifts.ps1
