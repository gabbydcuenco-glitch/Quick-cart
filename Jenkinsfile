// QuickCart CI/CD pipeline (declarative pipeline as code)
// Checkout -> Test -> Build Images -> Deploy -> Smoke Test
pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'quickcart'
        TAG = "${env.BUILD_NUMBER}"          // every image is tagged with the build number
    }

    triggers {
        githubPush()                         // A. GitHub webhook (instant, needs ngrok)
        pollSCM('H/2 * * * *')               // B. fallback: check GitHub every 2 minutes
    }

    options {
        disableConcurrentBuilds()            // one deployment at a time
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Test') {
            // Runs the "test" stage of each Dockerfile: Jest for the 3 APIs, ESLint for the frontend.
            // A failing test fails the build HERE, so Build Images and Deploy never run.
            steps {
                sh 'docker build --target test -t quickcart/catalog-api:test ./catalog-api'
                sh 'docker build --target test -t quickcart/order-api:test ./order-api'
                sh 'docker build --target test -t quickcart/payment-api:test ./payment-api'
                sh 'docker build --target test -t quickcart/frontend:test ./frontend'
            }
        }

        stage('Build Images') {
            steps {
                withCredentials([file(credentialsId: 'quickcart-env', variable: 'ENV_FILE')]) {
                    sh '''
                        cp "$ENV_FILE" .env
                        sed -i 's/\\r$//' .env
                        docker compose build
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'quickcart-env', variable: 'ENV_FILE')]) {
                    sh '''
                        cp "$ENV_FILE" .env
                        sed -i 's/\\r$//' .env
                        sh scripts/deploy.sh
                    '''
                }
            }
        }

        stage('Smoke Test') {
            // Calls every health endpoint and one catalog query THROUGH the proxy
            steps { sh 'sh scripts/smoke-test.sh --payment-routes' }
        }
    }

    post {
        success {
            sh 'docker port quickcart-proxy-1 8080'
        }
        failure {
            echo "Build ${TAG} failed. Check the red stage. If it failed before Deploy, the previous version is still running."
            echo "Roll back with the quickcart-rollback job, or: TAG=<previous> docker compose -p quickcart up -d --no-build"
        }
        always {
            sh 'rm -f .env'
        }
    }
}
