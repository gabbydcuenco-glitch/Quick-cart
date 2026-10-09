# QuickCart live verification and demonstration

## Before recording

Use production mode, stop host Vite, and start the application and separate Jenkins stack.
Run npm.cmd run verify. Record the actual output and capture browser screenshots.
Do not capture passwords, access tokens or secret-file contents.

Configure the Jenkins Pipeline from SCM and the quickcart-env credential using the same
PostgreSQL credentials as the application. Build once, then verify a push triggers a new
run automatically. A manual Build Now is setup only, not evidence of automatic deployment.

## Ten minute presentation with five speakers

1. Kyle, 0:00-1:30: show containers and architecture, explain the separate Jenkins stack.
2. John, 1:30-3:00: show product search, cart, checkout and current footer build number.
3. Jan, 3:00-5:00: push a visible change in a demo branch/job agreed by the group;
   show automatic Jenkins stages and refresh the application.
4. Shaira, 5:00-7:00: on the same agreed demo branch, change HOLIDAY_DISCOUNT_CENTS
   from 1000 to 500 in order-api/src/logic.js. Push and show Test fails, Deploy is
   skipped, and the browser retains its earlier build. Revert only that deliberate
   demo commit, push again, and wait for a successful deployment.
5. Angeline, 7:00-9:00: show an order created before deployment still exists;
   then show rollback to an earlier successful PostgreSQL build and recheck its order.
6. All, 9:00-10:00: explain lessons and each member's actual contributions.

Prepare the failing-test demonstration on an agreed branch. Do not alter unrelated
commits or represent seeded orders as newly created persistence evidence.

## Checkout and persistence

Create a new order using a unique demo email and the simulated PayPal method.
Record the returned order number and verify it appears in My Account.
Redeploy through Jenkins, then find the SAME order number again. For an additional
restart proof, use docker compose down followed by docker compose up -d --no-build.
Never add -v. Save before/after screenshots showing the same order and build labels.

## Rollback

Use a previous successful PostgreSQL build number whose database schema is compatible.
Confirm all six images still exist. Run the rollback job with ROLLBACK_TAG set to that
number. Show its successful smoke check, restored footer and the same order.
Do not roll back to images from the older MySQL implementation.

## Evidence files

Capture containers, checkout, automatic trigger, green stages, failed Test with skipped
Deploy, unchanged app build after failure, order before/after redeployment, rollback
stages and restored footer. Store sanitized screenshots in docs/evidence/.
Record a backup demonstration video after a successful rehearsal.

## Git collaboration

Use the real shared repository. Each member commits their own actual work, preferably
through branches and pull requests. Add the instructor as collaborator or use a public
repository with secrets excluded. A contribution table does not replace Git history.
