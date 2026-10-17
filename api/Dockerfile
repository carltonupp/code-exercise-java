FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

COPY openapi.yaml ./openapi.yaml
WORKDIR /workspace/api
COPY api/gradlew api/settings.gradle api/build.gradle ./
COPY api/gradle ./gradle
COPY api/src ./src
RUN chmod +x gradlew && ./gradlew --no-daemon bootJar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/api/build/libs/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
