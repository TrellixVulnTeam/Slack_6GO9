evaluate(new File("${WORKSPACE}/common.groovy"))

import utilities.StatusUpdater

name = 'workflow-test-release'

job(name) {
  description """
    <p>Runs a given workflow-[RELEASE]-e2e tests chart against a workflow-[RELEASE] chart candidate using e2e-runner</p>
  """.stripIndent().trim()

  logRotator {
    daysToKeep defaults.daysToKeep
  }

  publishers {
    slackNotifications {
      customMessage(defaults.testJob["reportMsg"])
      notifyAborted()
      notifyFailure()
      notifySuccess()
      includeTestSummary()
     }

     archiveJunit('${BUILD_NUMBER}/logs/junit*.xml') {
       retainLongStdout(false)
       allowEmptyResults()
     }

     archiveArtifacts {
       pattern('${BUILD_NUMBER}/logs/**')
       onlyIfSuccessful(false)
       fingerprint(false)
       allowEmpty()
     }
   }

   concurrentBuild()
   throttleConcurrentBuilds {
     maxTotal(defaults.maxWorkflowReleaseConcurrentBuilds)
   }

  parameters {
   stringParam('WORKFLOW_BRANCH', 'master', "The branch to use for installing the workflow chart.")
   stringParam('WORKFLOW_E2E_BRANCH', 'master', "The branch to use for installing the workflow-e2e chart.")
   stringParam('RELEASE', 'rc1', "Release string for resolving workflow-[release](-e2e) charts")
   stringParam('HELM_REMOTE_REPO', 'https://github.com/deis/charts.git', "The remote repo to use for fetching charts.")
   stringParam('E2E_RUNNER_IMAGE', 'quay.io/deisci/e2e-runner:latest', "The e2e-runner image")
   stringParam('E2E_DIR', '/home/jenkins/workspace/$JOB_NAME/$BUILD_NUMBER', "Directory for storing workspace files")
   stringParam('E2E_DIR_LOGS', '${E2E_DIR}/logs', "Directory for storing logs. This directory is mounted into the e2e-runner container")
  }

  triggers {
    cron('@daily')
  }

  wrappers {
    buildName('workflow-${RELEASE} #${BUILD_NUMBER}')
    timeout {
      absolute(defaults.testJob["timeoutMins"])
      failBuild()
    }
    timestamps()
    colorizeOutput 'xterm'
    credentialsBinding {
      string("AUTH_TOKEN", "a62d7fe9-5b74-47e3-9aa5-2458ba32da52")
      string("GITHUB_ACCESS_TOKEN", "8e11254f-44f3-4ddd-bf98-2cabcb7434cd")
    }
  }

  steps {
    shell E2E_RUNNER_JOB
  }
}
