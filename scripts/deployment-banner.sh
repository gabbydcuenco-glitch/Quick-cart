#!/bin/sh
set -eu
# Resolve the actual published port; no .env dependency in Jenkins post actions.
proxy=$(docker ps -q --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME:-quickcart}" --filter 'label=com.docker.compose.service=proxy')
[ -n "$proxy" ] || { echo 'Cannot show deployment link: proxy is not running.' >&2; exit 1; }
port=$(docker port "$proxy" 8080/tcp | head -n 1 | sed 's/.*://')
case "$port" in ''|*[!0-9]*) echo 'Cannot determine published application port.' >&2; exit 1;; esac
jenkins_port=$(docker port jenkins 8080/tcp | head -n 1 | sed 's/.*://')
case "$jenkins_port" in ''|*[!0-9]*) echo 'Cannot determine published Jenkins port.' >&2; exit 1;; esac
printf '\n\033[1;32mQUICKCART\033[0m  Build #%s deployed successfully\n\n' "${TAG:-unknown}"
printf '  \033[1;32m➜\033[0m  Local:   \033[1;34mhttp://localhost:%s/\033[0m\n' "$port"
printf '  \033[1;32m➜\033[0m  Jenkins: \033[1;34mhttp://localhost:%s/\033[0m\n\n' "$jenkins_port"
