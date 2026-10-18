# API usage

The API contract lives in [`openapi.yaml`](../openapi.yaml). Create a link with a custom alias:

```sh
curl -i http://localhost:8080/shorten \
  -H 'Content-Type: application/json' \
  -d '{"fullUrl":"https://example.com/reports/quarterly","customAlias":"quarterly-report"}'
```

The `201 Created` response contains a `shortUrl`, such as `http://localhost:3000/quarterly-report`. Omit `customAlias` to have the API generate one.

| Operation | Endpoint | Result |
|---|---|---|
| Create a short link | `POST /shorten` | `201 Created` with the short URL |
| List active links | `GET /urls` | `200 OK` with the active link collection |
| Resolve an active alias | `GET /{alias}` | `302 Found` with the destination in `Location` |
| Delete an active alias | `DELETE /{alias}` | `204 No Content` |
| Check API health | `GET /actuator/health` | `200 OK` when healthy |

The UI paginates the link list in groups of 20 at its server boundary; the API’s `GET /urls` contract remains an unpaginated collection. API errors use `application/problem+json` with stable problem types. A deleted or unknown alias returns `404` from the API; the web app turns those responses into the appropriate browser page.

The browser uses the Next.js routes `/api/shorten`, `/api/urls`, and `/api/urls/{alias}`. These call the Spring API above; browser visits to `/{alias}` go through the web resolution route. See the [architecture overview](architecture/overview.md) for the application boundaries.

For environment settings and public short-link origins, see [configuration](configuration.md). For generated types and validation commands, see [development](development.md).
