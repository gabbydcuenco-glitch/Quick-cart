# Finish Jenkins after GitHub upload

The running local Jenkins now has the required plugins and quickcart-env credential. Both Jenkinsfiles passed Jenkins declarative validation. Jobs are intentionally awaiting the real repository URL.

From the project directory:

```powershell
node scripts/Configure-Jenkins.mjs https://github.com/OWNER/REPOSITORY.git main
```

Replace the URL and branch with the real values. For a private repository, first create a Jenkins username/token Git credential and provide its ID as the third argument. Do not put tokens in the repository URL.

The script checks plugins/credentials, creates quickcart and quickcart-rollback from SCM, and preserves existing jobs. It starts no builds. Stop host Vite before the first production build to free port 8080. Run one initial quickcart build to load the Jenkinsfile trigger configuration. Subsequent pushes must automatically trigger builds via Poll SCM; a manual build is not the required automatic-trigger proof.

Follow docs/demo-runbook.md for the deliberately failing test, persistence and compatible rollback demonstrations. The local no-login Jenkins is bound to loopback; use Poll SCM for this setup.
