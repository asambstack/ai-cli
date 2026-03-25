#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Generate docker-compose.generated.yml from config.yaml
# Called by Tiltfile before loading docker_compose()
# ═══════════════════════════════════════════════════════════════

DEVENV_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$DEVENV_DIR/config.yaml"
OUTPUT="$DEVENV_DIR/docker-compose.generated.yml"

if [ ! -f "$CONFIG" ]; then
  echo "ERROR: config.yaml not found. Run: bash $DEVENV_DIR/setup-config.sh"
  exit 1
fi

# Parse values from config.yaml (simple grep-based, no external deps)
get_val() {
  local key="$1"
  local default="$2"
  local val
  val=$(grep "^${key}:" "$CONFIG" 2>/dev/null | head -1 | sed 's/^[^:]*: *//' | sed 's/~/${HOME}/g' | envsubst 2>/dev/null || echo "")
  # Expand ~ manually
  val="${val//\~/$HOME}"
  echo "${val:-$default}"
}

get_nested() {
  local parent="$1" key="$2" default="$3"
  local val
  val=$(awk "/^${parent}:/{found=1} found && /^  ${key}:/{print; exit}" "$CONFIG" | sed 's/^[^:]*: *//')
  echo "${val:-$default}"
}

DEV_DIR=$(get_val "dev_dir" "$HOME/development")
DEVENV="$DEVENV_DIR"
PG_USER=$(get_nested "postgres" "user" "browserstack")
PG_PASS=$(get_nested "postgres" "password" "Password123")
PG_DB=$(get_nested "postgres" "database" "obs")
MY_USER=$(get_nested "mysql" "user" "root")
MY_PASS=$(get_nested "mysql" "password" "Root@123")
MY_TESTHUB_DB=$(get_nested "mysql" "testhub_database" "testhub_database")
ES_USER=$(get_nested "elasticsearch" "user" "elastic")
ES_PASS=$(get_nested "elasticsearch" "password" "random@123")

cat > "$OUTPUT" <<YAML
# AUTO-GENERATED from config.yaml — do not edit manually
# Regenerate: bash $DEVENV_DIR/generate-compose.sh

services:
  o11y-ingest:
    build:
      context: ${DEV_DIR}/observability-pipeline
      dockerfile: ${DEVENV}/dockerfiles/o11y-service.Dockerfile
      args:
        MODULE: ingest
    container_name: tilt-o11y-ingest
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "9090:9090"
    environment:
      JAVA_X_OPTS: "-Xms256m -Xmx512m"
      SERVER_PORT: 9090
      SPRING_KAFKA_BOOTSTRAP_SERVERS: host.docker.internal:9092
      SPRING_DATASOURCE_URL: jdbc:postgresql://host.docker.internal:5432/${PG_DB}
      SPRING_DATASOURCE_USERNAME: ${PG_USER}
      SPRING_DATASOURCE_PASSWORD: ${PG_PASS}
      SPRING_ELASTICSEARCH_REST_URIS: http://host.docker.internal:9200
      SPRING_ELASTICSEARCH_REST_USERNAME: ${ES_USER}
      SPRING_ELASTICSEARCH_REST_PASSWORD: ${ES_PASS}
      SPRING_REDIS_HOST: host.docker.internal
      SPRING_REDIS_PORT: 6379

  o11y-consumer:
    build:
      context: ${DEV_DIR}/observability-pipeline
      dockerfile: ${DEVENV}/dockerfiles/o11y-service.Dockerfile
      args:
        MODULE: consumer
    container_name: tilt-o11y-consumer
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "9091:9091"
    environment:
      JAVA_X_OPTS: "-Xms256m -Xmx512m -Drails_auth.client_id=client-1234 -Drails_auth.client_keys=client-secret-1234"
      SERVER_PORT: 9091
      SPRING_KAFKA_BOOTSTRAP_SERVERS: host.docker.internal:9092
      SPRING_DATASOURCE_URL: jdbc:postgresql://host.docker.internal:5432/${PG_DB}
      SPRING_DATASOURCE_USERNAME: ${PG_USER}
      SPRING_DATASOURCE_PASSWORD: ${PG_PASS}
      SPRING_ELASTICSEARCH_REST_URIS: http://host.docker.internal:9200
      SPRING_ELASTICSEARCH_REST_USERNAME: ${ES_USER}
      SPRING_ELASTICSEARCH_REST_PASSWORD: ${ES_PASS}
      SPRING_REDIS_HOST: host.docker.internal
      SPRING_REDIS_PORT: 6379

  o11y-logproxy:
    build:
      context: ${DEV_DIR}/observability-pipeline
      dockerfile: ${DEVENV}/dockerfiles/o11y-service.Dockerfile
      args:
        MODULE: logproxy
    container_name: tilt-o11y-logproxy
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "8099:8099"
    environment:
      JAVA_X_OPTS: "-Xms256m -Xmx512m"
      SERVER_PORT: 8099
      SPRING_KAFKA_BOOTSTRAP_SERVERS: host.docker.internal:9092
      SPRING_DATASOURCE_URL: jdbc:postgresql://host.docker.internal:5432/${PG_DB}
      SPRING_DATASOURCE_USERNAME: ${PG_USER}
      SPRING_DATASOURCE_PASSWORD: ${PG_PASS}
      SPRING_ELASTICSEARCH_REST_URIS: http://host.docker.internal:9200
      SPRING_ELASTICSEARCH_REST_USERNAME: ${ES_USER}
      SPRING_ELASTICSEARCH_REST_PASSWORD: ${ES_PASS}
      SPRING_REDIS_HOST: host.docker.internal
      SPRING_REDIS_PORT: 6379

  # o11y-preprocessor removed — runs natively via Tilt local_resource

  o11y-api:
    build:
      context: ${DEV_DIR}/observability-api
      dockerfile: ${DEVENV}/dockerfiles/o11y-api.Dockerfile
    container_name: tilt-o11y-api
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "8085:8080"
    environment:
      JAVA_X_OPTS: "-Xms256m -Xmx512m"
      SERVER_PORT: 8080
      SPRING_DATASOURCE_URL: jdbc:postgresql://host.docker.internal:5432/${PG_DB}
      SPRING_DATASOURCE_USERNAME: ${PG_USER}
      SPRING_DATASOURCE_PASSWORD: ${PG_PASS}
      SPRING_ELASTICSEARCH_REST_URIS: http://host.docker.internal:9200
      SPRING_ELASTICSEARCH_REST_USERNAME: ${ES_USER}
      SPRING_ELASTICSEARCH_REST_PASSWORD: ${ES_PASS}
      SPRING_REDIS_HOST: host.docker.internal
      SPRING_REDIS_PORT: 6379
      SPRING_TESTHUB_DATASOURCE_URL: jdbc:mysql://host.docker.internal:3306/${MY_TESTHUB_DB}
      SPRING_TESTHUB_DATASOURCE_USERNAME: ${MY_USER}
      SPRING_TESTHUB_DATASOURCE_PASSWORD: ${MY_PASS}

  context-generator:
    build:
      context: ${DEV_DIR}/misc-services/context_generator/bstack_parser
      dockerfile: Dockerfile
      args:
        - ssh_prv_key
    container_name: tilt-context-generator
    extra_hosts:
      - "host.docker.internal:host-gateway"
    env_file:
      - ${DEV_DIR}/misc-services/context_generator/.env
    ports:
      - "3005:3000"
    environment:
      APP_ENV: dev
      POD_TYPE: "server"
    volumes:
      - ${DEV_DIR}/misc-services/context_generator/bstack_parser/server:/app/server
      - ${DEV_DIR}/misc-services/context_generator/bstack_parser/configs:/config
      - ~/.aws:/home/app/.aws

  llm-service:
    build:
      context: ${DEV_DIR}/misc-services/context_generator/llm_parser
      dockerfile: Dockerfile
      args:
        - ssh_prv_key
    container_name: tilt-llm-service
    extra_hosts:
      - "host.docker.internal:host-gateway"
    env_file:
      - ${DEV_DIR}/misc-services/context_generator/.env
    ports:
      - "3006:3001"
    environment:
      APP_ENV: dev
      PORT: 3001
    volumes:
      - ${DEV_DIR}/misc-services/context_generator/llm_parser/src:/app/src
      - ${DEV_DIR}/misc-services/context_generator/llm_parser/configs:/config
YAML

echo "docker-compose.generated.yml written"
