import { describe, expect, it } from "vitest";
import { renderLinkResolutionPage } from "./linkResolutionPage";

describe("renderLinkResolutionPage", () => {
  it("renders a deleted-link message without displaying its alias", () => {
    const html = renderLinkResolutionPage("deleted", "old-link");

    expect(html).toContain("This link has been retired");
    expect(html).toContain("LINK RETIRED");
    expect(html).toContain('<link rel="stylesheet" href="/styles/shared.css">');
    expect(html).toContain('<body class="resolution-page">');
    expect(html).not.toContain("<style>");
    expect(html).not.toContain("<code class=\"alias\">/old-link</code>");
  });

  it("renders a not-found page with an escaped alias badge", () => {
    const html = renderLinkResolutionPage("not-found", "<script>alert('x')</script>");

    expect(html).toContain("We couldn&#39;t find that link");
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(");
  });

  it("renders the service-unavailable recovery message without an alias", () => {
    const html = renderLinkResolutionPage("service-unavailable", "blocked");

    expect(html).toContain("We can&#39;t open this link right now");
    expect(html).toContain("Please try again in a moment");
    expect(html).not.toContain("<code class=\"alias\">/blocked</code>");
  });
});
