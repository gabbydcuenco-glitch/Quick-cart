# QuickCart startup

Keep Docker Desktop running (Linux containers). Install Node.js 22.12 or newer. The first build needs Internet.

Extract this ZIP into a folder on any laptop. In that folder run:

    npm install
    npm run dev

npm run dev automatically starts and verifies the Docker database and APIs, installs any missing frontend dependencies, then opens the normal Vite development server in the terminal. The .js setup lines and package installation output are expected:

    VITE v8.3.3 ready
    Local: http://localhost:8080/

Open the exact Local URL printed by Vite. If port 8080 is occupied, Vite picks the next free port. Keep this terminal open. Ctrl+C stops Vite.

No saved database password is needed. No password must be copied from another laptop. The generated .env only stores the installation ID, port, image tag, and database username. Existing password-based databases belonging to this installation are converted automatically without deleting their tables or orders. PostgreSQL accepts connections only within the private Docker network; it has no published host port. This configuration is for the local classroom/demo app.

Docker is required before Vite starts. If Docker or the QuickCart backend stops, the shop becomes unavailable and Vite exits after repeated failed checks. A single slow Docker response no longer closes Vite immediately. Closing only the Docker Desktop window may leave its engine running.

Each fresh extraction creates its own Docker project and database. Each laptop has its own local data. Keep the generated .env in an existing installation to reconnect to its data. Share the clean ZIP for a new installation.

Other commands:

    npm start           # Entire application served from Docker
    npm stop            # Stop this installation, keep database data
    npm run setup:dev   # Rebuild and verify Docker services
    npm run logs        # Show Docker service logs

Windows shortcut: START-QUICKCART.cmd starts the entire application in Docker. To use the Vite terminal, run npm run dev as shown above.


