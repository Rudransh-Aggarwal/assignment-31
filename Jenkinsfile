pipeline {
    agent any

    environment {
        // Docker Hub image name — update to your Docker Hub username
        IMAGE_NAME       = "your-dockerhub-username/assignment-31"
        IMAGE_TAG        = "${env.BUILD_NUMBER}"
        DOCKER_REGISTRY  = "https://index.docker.io/v1/"
        // Jenkins credential ID storing your Docker Hub username/password
        DOCKER_CREDS     = credentials('dockerhub-credentials')
        // Container / compose project name
        COMPOSE_PROJECT  = "assignment31"
        APP_PORT         = "5000"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {

        // ── 1. Checkout ────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ── 2. Install & Lint — Server ─────────────────────────────────────────
        stage('Server — Install Dependencies') {
            steps {
                dir('server') {
                    sh 'npm ci --omit=dev'
                }
            }
        }

        // ── 3. Install & Build — React Client ─────────────────────────────────
        stage('Client — Install & Build') {
            steps {
                dir('client') {
                    sh 'npm ci --legacy-peer-deps'
                    sh 'npm run build'
                }
            }
        }

        // ── 4. Docker Build ────────────────────────────────────────────────────
        stage('Docker — Build Image') {
            steps {
                script {
                    dockerImage = docker.build("${IMAGE_NAME}:${IMAGE_TAG}")
                    // Also tag as latest
                    sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
                }
            }
        }

        // ── 5. Smoke Test — spin up compose, hit health endpoint ───────────────
        stage('Smoke Test') {
            steps {
                script {
                    // Bring up services in background
                    sh """
                        docker compose -p ${COMPOSE_PROJECT} up -d --build
                        echo "Waiting for app to be ready..."
                        sleep 15
                    """
                    // Basic health check — server should respond on /items
                    sh """
                        curl --retry 5 --retry-delay 3 --fail \
                            http://localhost:${APP_PORT}/items \
                            -o /dev/null -w "HTTP status: %{http_code}\\n"
                    """
                }
            }
            post {
                always {
                    // Always tear down compose after smoke test
                    sh "docker compose -p ${COMPOSE_PROJECT} down -v || true"
                }
            }
        }

        // ── 6. Push to Docker Hub ──────────────────────────────────────────────
        stage('Docker — Push Image') {
            when {
                branch 'main'   // Only push from main branch
            }
            steps {
                script {
                    docker.withRegistry(DOCKER_REGISTRY, 'dockerhub-credentials') {
                        dockerImage.push("${IMAGE_TAG}")
                        dockerImage.push("latest")
                    }
                }
            }
        }

        // ── 7. Deploy (optional — update to match your server setup) ──────────
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo """
                    =========================================================
                    Deploy stage — customise for your target environment.

                    Examples:
                      SSH to server:
                        sshagent(['my-server-ssh-key']) {
                            sh '''
                                ssh user@your-server "
                                    docker pull ${IMAGE_NAME}:latest &&
                                    docker compose -f /opt/app/docker-compose.yml up -d
                                "
                            '''
                        }

                      Or use kubectl / Helm if deploying to Kubernetes.
                    =========================================================
                    """
                }
            }
        }
    }

    // ── Post-build actions ─────────────────────────────────────────────────────
    post {
        success {
            echo "✅ Build #${env.BUILD_NUMBER} succeeded — image: ${IMAGE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo "❌ Build #${env.BUILD_NUMBER} failed. Check the logs above."
            // Ensure compose is stopped if something blew up mid-test
            sh "docker compose -p ${COMPOSE_PROJECT} down -v || true"
        }
        cleanup {
            // Remove dangling images to keep disk tidy
            sh "docker image prune -f || true"
        }
    }
}
