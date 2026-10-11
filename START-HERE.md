# QuickCart — run on any laptop

Requirements on each laptop:

- Docker Desktop running with Linux containers.
- Node.js 22.12 or newer (a supported LTS release is recommended).
- Internet for the first dependency installation and Docker image build.

Extract the ZIP into a folder. Open the terminal in that folder, where package.json is located.

First setup:

    npm install
    npm run dev

Later starts, in the same folder:

    npm run dev

The first setup installs missing dependencies and builds missing Docker images.
Later starts reuse them without another installation or build. Routine Docker
Running/Healthy progress is hidden on later starts. Tests, health checks, and all
six Docker services remain included; genuine startup errors are still displayed.
Deleted dependencies or images must be prepared again.

Wait for the normal Vite output and open its exact Local URL:

    VITE v8.3.3 ready
    Local: http://localhost:8080/

localhost is this laptop's local address. No shared network address is required.
Each laptop starts its own copy with its own Docker; it does not connect to
another laptop's Docker. Vite displays only the Local URL.

If 8080 is occupied, QuickCart uses 8081 or the next available port. It checks
both IPv4 and IPv6 so another running copy does not intercept localhost.
Leave the terminal and Docker engine running. Ctrl+C stops the Vite website.

Each laptop runs its own Docker installation and database. No saved database
password is needed and no password needs copying from another laptop. The
generated .env contains the installation ID, port, image tag, and database user.
Keep it in the existing folder to retain the database connection and orders.
Share the clean ZIP, which excludes .env and node_modules, for a new installation.

Docker is required before Vite starts. If the Docker engine or this installation's
gateway stops, Vite exits after repeated runtime failures. A temporarily slow or
restarting API shows the reconnect screen and can recover without closing Vite.
Closing only the Docker Desktop window may leave its engine running.

Other commands (all existing tests and features are retained):

    npm run doctor       # Check Docker, APIs and the actual Vite URL
    npm run ps           # Show the containers and health status
    npm run logs         # Show Docker logs if an error occurs
    npm run setup:dev    # Rebuild after backend or Dockerfile changes
    npm run test:startup # Run startup/network regression tests
    npm test             # Run the original Docker test stages
    npm run jenkins      # Start the separate Jenkins service
    npm start            # Serve the entire application from Docker
    npm stop             # Stop this installation, preserve database data

Frontend edits in Vite update normally. Rebuild container images explicitly after
backend/container source changes. Do not delete Docker volumes to fix a startup
problem: doing so would remove stored orders.

npm start prints a separate Docker-served URL and returns while containers keep
running. npm run dev prints the Vite URL and stays active until Ctrl+C. Use the
URL printed by the command you are running.

See docs/V7-VERIFICATION.md for verification details; earlier backend test results
are recorded in docs/V6-VERIFICATION.md.
