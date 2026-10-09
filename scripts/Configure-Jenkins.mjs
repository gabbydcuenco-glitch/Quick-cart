// Run after publishing the QuickCart repository. Requires Node 20+.
// Example: node scripts/Configure-Jenkins.mjs https://github.com/OWNER/REPO.git main
const [repository, branch='main', gitCredential=''] = process.argv.slice(2);
if (!repository || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(repository)) {
  throw new Error('Provide your real HTTPS GitHub repository URL and branch. Do not put tokens in the URL.');
}
const base='http://127.0.0.1:8081';
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const pluginsResponse=await fetch(base+'/pluginManager/api/json?tree=plugins[shortName,active]');
if(!pluginsResponse.ok)throw new Error('Jenkins plugin list unavailable');
const plugins=(await pluginsResponse.json()).plugins;
const required=['workflow-job','workflow-cps','pipeline-model-definition','git','github','credentials-binding','plain-credentials'];
const missing=required.filter(name=>!plugins.some(p=>p.shortName===name&&p.active));
if(missing.length)throw new Error('Install/activate Jenkins plugins first: '+missing.join(', '));
const cred=await fetch(base+'/credentials/store/system/domain/_/credential/quickcart-env/api/json');
if(!cred.ok)throw new Error('Create Secret file credential quickcart-env before creating jobs.');
const cr=await fetch(base+'/crumbIssuer/api/json');const crumb=await cr.json();
const cookie=cr.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
const headers={'Content-Type':'application/xml',Cookie:cookie,[crumb.crumbRequestField]:crumb.crumb};
for(const [name,script] of [['quickcart','Jenkinsfile'],['quickcart-rollback','Jenkinsfile.rollback']]) {
  const existing=await fetch(base+'/job/'+name+'/api/json');
  if(existing.ok){console.log(name+' already exists; preserved. Review its SCM settings in Jenkins.');continue;}
  if(existing.status!==404)throw new Error('Cannot check existing job '+name);
  const parameters=name==='quickcart-rollback'?'<hudson.model.ParametersDefinitionProperty><parameterDefinitions><hudson.model.StringParameterDefinition><name>ROLLBACK_TAG</name><description>Previous successful compatible build number</description><defaultValue></defaultValue><trim>true</trim></hudson.model.StringParameterDefinition></parameterDefinitions></hudson.model.ParametersDefinitionProperty>':'';
  const config=`<?xml version="1.0" encoding="UTF-8"?><flow-definition plugin="workflow-job"><description>QuickCart PostgreSQL classroom pipeline. Source: ${xml(repository)}</description><keepDependencies>false</keepDependencies><properties>${parameters}</properties><definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps"><scm class="hudson.plugins.git.GitSCM" plugin="git"><configVersion>2</configVersion><userRemoteConfigs><hudson.plugins.git.UserRemoteConfig><url>${xml(repository)}</url><credentialsId>${xml(gitCredential)}</credentialsId></hudson.plugins.git.UserRemoteConfig></userRemoteConfigs><branches><hudson.plugins.git.BranchSpec><name>*/${xml(branch)}</name></hudson.plugins.git.BranchSpec></branches><doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations><submoduleCfg class="empty-list"/><extensions/></scm><scriptPath>${script}</scriptPath><lightweight>true</lightweight></definition><triggers/><disabled>false</disabled></flow-definition>`;
  const r=await fetch(base+'/createItem?name='+name,{method:'POST',headers,body:config,redirect:'manual'});
  if(![200,302].includes(r.status))throw new Error('Job creation failed: '+name+' HTTP '+r.status);
  const check=await fetch(base+'/job/'+name+'/api/json');if(!check.ok)throw new Error('Job not found after creation');
  console.log('Created '+name+' from '+script);
}
console.log('No builds started. Stop host Vite before production deployment on 8080. Run the first quickcart build once to register Jenkinsfile triggers; then prove a later push automatically builds.');
