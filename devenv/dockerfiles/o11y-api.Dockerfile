# O11Y API - Local Development
# Pre-build required: cd observability-api && ./gradlew bootJar

FROM eclipse-temurin:17-jre

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY build/libs/*.jar app.jar

ENTRYPOINT ["sh", "-c", "java ${JAVA_X_OPTS} -jar app.jar"]
