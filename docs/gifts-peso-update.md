# Gifts and peso update — 10 October 2026

The complete list from male-female-unisex gifts.docx is in
catalog-api/src/gift-products.json: 10 Gifts for Men, 10 Gifts for Women,
and 10 Unisex gifts. Each uses the midpoint of its supplied PHP price range.
The open-ended fitness-ring range uses the listed 4,500–8,500 bounds.
Product types and source ranges are retained in that file.

Six additional Couples products: matching bracelets, ceramic mugs, memory
scrapbook, date-night cards, matching hoodies, and a picnic gift set.
The existing pajamas and double flasks also appear under Couples.
Fresh databases therefore show 45 products, including eight Couples products.
New items start with demo stock of 40 and no reviews. Prices and stock are
demo values. The Word file supplied no product photos; icons identify products.

All current catalog prices, quotes, and new orders use PHP. The nine legacy
products have explicit new demo peso prices, not a market exchange-rate conversion.
Existing orders retain their original USD amounts and saved line items.
Order history and confirmation use each order's stored currency.
The peso offer is PHP 300 off PHP 3,000; express shipping is PHP 149.
Standard shipping remains free.

The catalog service applies a transaction-protected, recorded migration before
listening. It runs on both new and existing PostgreSQL volumes. Repeat starts do
not duplicate products, change existing orders, or replenish sold stock.
The orders service waits for catalog health during Compose startup.
If custom legacy USD products are found, the migration rolls back and names
those products so explicit peso prices can be added safely.

## Run the updated source

Keep Docker Desktop running. For an existing database, keep the .env from
that installation; its password must match the existing PostgreSQL volume.
For a completely new database, setup generates .env.

    npm.cmd install
    npm.cmd run setup:dev
    npm.cmd run dev

Vite: http://localhost:8083 (or the next free port printed in the terminal).
Docker gateway: http://127.0.0.1:8082. Jenkins: http://localhost:8081.
npm install now installs frontend dependencies; npm run dev also repairs
missing dependencies automatically. Later runs reuse the installed packages.
Rebuild the backend once after applying this catalog update with setup:dev.

Do not remove the PostgreSQL volume to update the catalog.
The source ZIP excludes local credentials, installed dependencies, and build output.

## Verification

Passed: 20 catalog tests, 55 order tests, existing delivery PostgreSQL integration,
and the new gifts PostgreSQL integration (actual migration SQL, repeated startup,
stock preservation, PHP checkout, original USD orders, HTTP product filters,
search suggestions, quotes, and history).
Frontend lint and production build passed. Vite startup returned HTTP 200 for
the page and client; PHP and legacy USD formatting were checked.
Compose host configuration passed validation.
Live Docker deployment was not performed: this session could not access the
Docker Desktop named pipe. Run setup:dev once on the updated source to apply
the migration to the real PostgreSQL volume.
