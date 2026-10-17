import { renderLinkResolutionPage } from "@/app/linkResolutionPage";

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

function isDeletedProblem(value: unknown) {
  return (
    typeof value === "object" && value !== null &&
    "title" in value && value.title === "Link deleted"
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { alias } = await context.params;
  if (!/^[A-Za-z0-9-]{3,16}$/.test(alias)) {
    return renderPage("not-found", alias, 404);
  }

  const apiBaseUrl = (process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");
  try {
    const response = await fetch(`${apiBaseUrl}/${encodeURIComponent(alias)}`, {
      cache: "no-store",
      redirect: "manual",
    });
    if (response.status === 302) {
      const location = response.headers.get("location");
      if (!location) return renderPage("service-unavailable", alias, 502);
      return new Response(null, {
        status: 302,
        headers: { "Cache-Control": "no-store", Location: location },
      });
    }
    if (response.status === 404) {
      const problem: unknown = await response.json().catch(() => null);
      return renderPage(isDeletedProblem(problem) ? "deleted" : "not-found", alias, 404);
    }
  } catch {
    return renderPage("service-unavailable", alias, 503);
  }
  return renderPage("service-unavailable", alias, 503);
}
