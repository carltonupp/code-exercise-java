# Configuration

Settings are defined by the API's [application properties](../api/src/main/resources/application.properties), the web server adapters, and [Docker Compose](../compose.yaml). See [development and local setup](development.md) for startup commands.

## Application settings

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `SHORT_URL_BASE_URL` | API | `http://localhost:3000` | Public origin used when returning created short links. Set this to the reachable web origin when hosting elsewhere. |
| `API_BASE_URL` | Web app | `http://localhost:8080` | API origin used by the web server. Compose sets it to `http://api:8080` inside the container network. |
| `DATABASE_URL` | API | `jdbc:sqlite:urlshortener.db` | JDBC URL for SQLite. Compose uses `/data/urlshortener.db` in the persistent volume. |

## OTLP metrics

The API includes Micrometer's OTLP metrics registry. It can push metrics to an externally configured collector using OTLP/HTTP protobuf, including the generated-alias counters `urlshortener.alias.generation.collisions` and `urlshortener.alias.generation.successes`. The service resource name defaults to the application name, `urlshortener`.

Export is disabled by default. No collector is bundled, and the project does not choose an export destination. When enabling export, supply the collector's full metrics URL, including its metrics path (commonly `/v1/metrics`). Set the URL explicitly when enabling export; Micrometer otherwise uses its framework default of `http://localhost:4318/v1/metrics`.

| Environment variable | Default | Purpose |
|---|---|---|
| `MANAGEMENT_OTLP_METRICS_EXPORT_ENABLED` | `false` | Enable OTLP metrics export. |
| `MANAGEMENT_OTLP_METRICS_EXPORT_URL` | Unset | Full OTLP/HTTP metrics URL reachable from the API process or container. Set this when enabling export. |
| `MANAGEMENT_OTLP_METRICS_EXPORT_STEP` | `1m` | Interval between exports; accepts Spring duration values such as `30s`. |
| `OTEL_EXPORTER_OTLP_METRICS_HEADERS` | Unset | Optional collector-specific HTTP headers, including authentication if needed. Keep credentials in the environment. |

Set `COLLECTOR_METRICS_URL` to your collector's full metrics URL, then run from the repository root:

```sh
MANAGEMENT_OTLP_METRICS_EXPORT_ENABLED=true \
MANAGEMENT_OTLP_METRICS_EXPORT_URL="${COLLECTOR_METRICS_URL:?Set the collector metrics URL first}" \
docker compose up --build --detach
```

The same settings work for direct API development:

```sh
cd api
MANAGEMENT_OTLP_METRICS_EXPORT_ENABLED=true \
MANAGEMENT_OTLP_METRICS_EXPORT_URL="${COLLECTOR_METRICS_URL:?Set the collector metrics URL first}" \
./gradlew bootRun
```

Compose forwards the four variables above to the API container. Metrics are pushed to the collector; this does not add a public scrape endpoint. Traces and logs are outside this metrics setup. The existing project checks validate the application with export disabled; end-to-end collection requires a configured collector.

See the [Spring Boot metrics reference](https://docs.spring.io/spring-boot/reference/actuator/metrics.html#actuator.metrics.export.otlp) and [Micrometer OTLP reference](https://docs.micrometer.io/micrometer/reference/implementations/otlp.html) for additional exporter settings.
