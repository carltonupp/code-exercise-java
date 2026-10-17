import createClient from "openapi-fetch";
import type { paths } from "../generated/openapi";

export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}
