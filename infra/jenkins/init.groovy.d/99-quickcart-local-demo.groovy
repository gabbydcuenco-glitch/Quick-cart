import jenkins.model.Jenkins
import jenkins.install.InstallState
import hudson.security.SecurityRealm
import hudson.security.AuthorizationStrategy
import java.nio.file.Files

// User-requested local classroom demo. Compose publishes only on 127.0.0.1.
if (System.getenv('QUICKCART_LOCAL_DEMO') == 'true') {
    def instance = Jenkins.get()
    def config = new File(instance.rootDir, 'config.xml').toPath()
    def backup = new File(instance.rootDir, 'config.before-quickcart-local-demo.xml').toPath()
    if (Files.exists(config) && !Files.exists(backup)) {
        Files.copy(config, backup)
    }
    instance.setSecurityRealm(SecurityRealm.NO_AUTHENTICATION)
    instance.setAuthorizationStrategy(AuthorizationStrategy.UNSECURED)
    instance.setSlaveAgentPort(-1)
    instance.setInstallState(InstallState.INITIAL_SETUP_COMPLETED)
    instance.save()
    println('QuickCart local demo: Jenkins login disabled. Keep port 8081 on localhost.')
}
