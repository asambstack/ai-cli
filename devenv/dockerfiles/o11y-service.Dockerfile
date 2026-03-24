# O11Y Pipeline Service - Local Development
# Pre-build required: cd observability-pipeline && ./gradlew ${MODULE}:bootJar
#
# Usage in docker-compose:
#   build:
#     args:
#       MODULE: ingest|consumer|logproxy|preprocessor

FROM eclipse-temurin:17-jre

ARG MODULE

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ${MODULE}/build/libs/*.jar app.jar

ENTRYPOINT ["sh", "-c", "java ${JAVA_X_OPTS} -jar app.jar"]
