# Delivery tracking classroom demo

Orders progress Processing → Shipped → Out for Delivery → Delivered. Open My Account, find the order, and select Track delivery. Use Demo: mark Shipped, then Demo: mark Out for Delivery. Confirm receipt to mark Delivered. Refresh tracking to fetch saved changes.

Standard shipping is estimated 3 days after checkout; express 1 day, each with a 4-hour arrival window. Dates display in Philippine time (PHT). These are estimates, not courier promises. The illustrated sample route is not geocoded to the shipping address and does not use real rider GPS. Progress is controlled manually for the classroom demonstration, not by a background courier feed.

Order status, ETA, receipt timestamp, delivery events and activity logs are stored in PostgreSQL. Startup migration adds columns and the delivery_events table to existing databases without deleting orders. Existing records retain their status and get an import event; unknown historical delivery times are not invented. The API waits for migration success before listening.

DELIVERY_DEMO=true in docker-compose.yml enables the controls and mutation endpoint. Disable it outside the classroom demo. Like the existing email-only order lookup, this demo has no customer authentication. The endpoint must not be exposed as a production courier API.

Restart from the project directory with npm.cmd run dev (stop the existing Vite terminal first). This rebuilds the Docker backend and starts Vite. Do not delete the database volume. For the production container frontend, use npm.cmd start instead.

Validation: backend tests exercise stage ordering, invalid actions, disabled demo controls, concurrent stale updates, repeat receipt confirmation and rollback on event-write failure. Actual PostgreSQL migration and browser checks require the local Docker engine to be accessible.
