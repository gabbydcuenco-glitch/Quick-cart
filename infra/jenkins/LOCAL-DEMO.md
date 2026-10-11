# Jenkins local demo

The user requested Jenkins without a login. Compose publishes 8081 only on
127.0.0.1, disables the initial setup wizard and enables a Groovy initialization
hook that removes authentication/authorization requirements. Inbound agents are
disabled. CSRF and Pipeline script security settings are not disabled.

Rebuild with the root npm run jenkins command. Open http://localhost:8081/ after
startup. Existing jobs and credentials remain in jenkins_home. The hook preserves
the previous config.xml once as config.before-quickcart-local-demo.xml in that volume.

Anyone who can reach this Jenkins has administrator access. Keep it on localhost
and use Poll SCM; do not expose this no-login demo through ngrok or a public tunnel.
If the initial plugin setup was skipped, use Manage Jenkins > Plugins to install
Pipeline, Git, GitHub, Credentials Binding and Docker Pipeline before creating jobs.
