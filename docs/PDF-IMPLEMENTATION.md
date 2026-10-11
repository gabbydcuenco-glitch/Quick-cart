# Implementation mapped to QuickCart.pdf

The user-supplied six-page QuickCart.pdf is unchanged. Its pages 3-4 describe
functional modules; page 5 contains section headings, not additional configuration
values or diagrams. This mapping does not invent requirements for those headings.

| PDF module | Implementation |
|---|---|
| Frontend browsing, categories, search, Holiday Deals, product details | frontend/src/pages/Home.jsx, Shop.jsx, ProductPage.jsx; catalog-api/src/server.js |
| Cart, quote, shipping, checkout | frontend/src/pages/Cart.jsx, Checkout.jsx; order-api/src/logic.js, server.js |
| Order history, delivery, contact and reconnect | frontend/src/pages/Account.jsx, Confirmation.jsx, Contact.jsx; frontend/src/components/DeliveryTracking.jsx, ServiceGate.jsx |
| Catalog from PostgreSQL and recorded PHP/gift migration | catalog-api/src/repo.js, migrate.js |
| Transactional order creation and stock updates | order-api/src/repo.js, gateway.js |
| Delivery statuses and support tickets | order-api/src/tracking.js, migrate.js, server.js |
| Simulated payment validation, approval/decline and reference | payment-api/src/gateway.js, server.js |
| Gateway routes /api/catalog, /api/orders, /api/support, /api/payment | proxy/nginx.conf |
| PostgreSQL 16, schema and persistent pg-data | db/Dockerfile, db/init.sql, docker-compose.yml |
| Separate Jenkins, automated stages, tagged images and rollback | infra/jenkins/docker-compose.yml, Jenkinsfile, Jenkinsfile.rollback, scripts/deploy.sh |
| Health and smoke checks | Dockerfiles, docker-compose.yml, scripts/smoke-test.sh, scripts/payment-smoke.js |

Application source, migrations, dependencies, tests and Docker configuration are
unchanged from the supplied ZIP. Existing About content, assets and development
helpers remain so this cleanup does not remove working app features. The PDF
does not prohibit supporting files required to implement its modules.

Older reports, presentations, product-generation notes and version-specific
verification notes were removed from this distribution to avoid conflicting
instructions. Real Jenkins rollback/failure evidence remains as historical evidence.
The original ZIP remains unchanged as a backup.

Portability requires a supported Node runtime, Docker with Linux containers,
sufficient resources and internet for first installation. Each laptop initializes
its own local instance. Verification on one machine cannot guarantee every Docker
environment or physically verify other laptops.
