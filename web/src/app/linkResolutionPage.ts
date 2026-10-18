type PageKind = "deleted" | "not-found" | "service-unavailable";

const linkIcon = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.2 19.8 9.8 22.2a5 5 0 0 1-7.1-7.1l5.6-5.6a5 5 0 0 1 7.1 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M19.8 12.2l2.4-2.4a5 5 0 0 1 7.1 7.1l-5.6 5.6a5 5 0 0 1-7.1 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="m11 21 10-10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 4"/></svg>`;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function renderLinkResolutionPage(kind: PageKind, alias: string) {
  const content = {
    deleted: {
      eyebrow: "LINK RETIRED",
      title: "This link has been retired",
      message: "The person who created this link removed it, so it no longer redirects to its destination.",
      recovery: "You can create a new short link or browse existing links.",
      alias: "",
    },
    "not-found": {
      eyebrow: "LINK NOT FOUND",
      title: "We couldn't find that link",
      message: "This address doesn't match a short link we know about.",
      recovery: "Check the address for a typo, or browse existing links to find the right one.",
      alias: `/${alias}`,
    },
    "service-unavailable": {
      eyebrow: "TEMPORARY ISSUE",
      title: "We can't open this link right now",
      message: "The short link service couldn't be reached.",
      recovery: "Please try again in a moment, or return to the URL Shortener.",
      alias: "",
    },
  }[kind];
  const title = escapeHtml(content.title);
  const aliasBadge = content.alias ? `<code class="alias">${escapeHtml(content.alias)}</code>` : "";

  const contentHtml = `
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">↗</span>URL Shortener
    </a>
    <section class="card" aria-labelledby="page-title">
      <div class="icon" aria-hidden="true">${linkIcon}</div>
      <p class="eyebrow">${content.eyebrow}</p>
      <h1 id="page-title">${title}</h1>
      <p class="message">${escapeHtml(content.message)}</p>
      ${aliasBadge}
      <p class="recovery">${escapeHtml(content.recovery)}</p>
      <nav class="actions" aria-label="Next steps">
        <a class="action primary" href="/#create-link">Create a short link</a>
        <a class="action" href="/#view-links">Browse existing links</a>
      </nav>
    </section>
    <footer>URL Shortener</footer>`;
  return renderDocument(title, contentHtml);
}

function renderDocument(escapedTitle: string, contentHtml: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapedTitle} · URL Shortener</title>
    <link rel="stylesheet" href="/styles/shared.css">
  </head>
  <body class="resolution-page">
    <main class="layout">${contentHtml}</main>
  </body>
</html>`;
}
