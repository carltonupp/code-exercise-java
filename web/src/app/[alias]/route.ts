import { renderLinkResolutionPage } from "@/app/linkResolutionPage";
import { resolveLink } from "@/server/linkResolution";

type RouteContext = { params: Promise<{ alias: string }> };

function renderPage(kind: "deleted" | "not-found" | "service-unavailable", alias: string, status: number) {
  return new Response(renderLinkResolutionPage(kind, alias), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}


export async function GET(_request: Request, context: RouteContext) {
  const { alias } = await context.params;
  const resolution = await resolveLink(alias);
  if (resolution.kind === "active") {
    return new Response(null, {
      status: 302,
      headers: { "Cache-Control": "no-store", Location: resolution.location },
    });
  }
  if (resolution.kind === "unavailable") {
    return renderPage("service-unavailable", alias, resolution.status);
  }
  return renderPage(resolution.kind, alias, 404);
}
