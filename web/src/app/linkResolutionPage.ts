type PageKind = "deleted" | "not-found" | "service-unavailable";

const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 32px 20px;
    background: radial-gradient(ellipse at 75% 10%, #e0eee5 0, transparent 38%), #f7f8f4;
    color: #172b26; font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif; }
  .layout { width: min(100%, 620px); }
  .brand { display: inline-flex; align-items: center; gap: 11px; margin: 0 0 24px; color: #176b52;
    font-size: 13px; font-weight: 800; letter-spacing: .12em; text-decoration: none; text-transform: uppercase; }
  .brand-mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 11px;
    background: #176b52; color: #fff; font-size: 18px; letter-spacing: 0; }
  .card { padding: clamp(28px, 7vw, 56px); border: 1px solid #e2e8e1; border-radius: 24px;
    background: #fff; box-shadow: 0 24px 70px #274f3812; }
  .icon { display: grid; width: 68px; height: 68px; place-items: center; margin-bottom: 30px;
    border: 1px solid #dcebe1; border-radius: 22px; background: #eff7f1; color: #176b52; }
  .icon svg { width: 32px; height: 32px; }
  .eyebrow { margin: 0 0 12px; color: #176b52; font-size: 11px; font-weight: 800; letter-spacing: .15em; }
  h1 { max-width: 440px; margin: 0; color: #172b26; font-size: clamp(30px, 6vw, 42px);
    line-height: 1.08; letter-spacing: -.055em; }
  .message { margin: 18px 0 0; color: #60716b; font-size: 16px; line-height: 1.7; }
  .recovery { margin: 12px 0 0; color: #60716b; font-size: 14px; line-height: 1.65; }
  .alias { display: inline-block; margin-top: 18px; padding: 7px 10px; border: 1px solid #e2e8e1;
    border-radius: 8px; background: #f7f8f4; color: #176b52; font: 600 13px ui-monospace, SFMono-Regular, Menlo, monospace; }
  .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
  .action { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; padding: 0 17px;
    border: 1px solid #dbe3dd; border-radius: 10px; color: #176b52; font-size: 14px; font-weight: 700; text-decoration: none; }
  .action.primary { border-color: #176b52; background: #176b52; color: #fff; }
  .action:hover { filter: brightness(.96); }
  footer { margin: 20px 4px 0; color: #85918b; font-size: 12px; }
  @media (max-width: 480px) { body { padding: 22px 16px; } .actions { flex-direction: column; }
    .action { width: 100%; } }
`;

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

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · URL Shortener</title><style>${styles}</style></head><body><main class="layout"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">↗</span>URL Shortener</a><section class="card" aria-labelledby="page-title"><div class="icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.2 19.8 9.8 22.2a5 5 0 0 1-7.1-7.1l5.6-5.6a5 5 0 0 1 7.1 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M19.8 12.2l2.4-2.4a5 5 0 0 1 7.1 7.1l-5.6 5.6a5 5 0 0 1-7.1 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="m11 21 10-10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 4"/></svg></div><p class="eyebrow">${content.eyebrow}</p><h1 id="page-title">${title}</h1><p class="message">${escapeHtml(content.message)}</p>${aliasBadge}<p class="recovery">${escapeHtml(content.recovery)}</p><nav class="actions" aria-label="Next steps"><a class="action primary" href="/#create-link">Create a short link</a><a class="action" href="/#view-links">Browse existing links</a></nav></section><footer>URL Shortener</footer></main></body></html>`;
}
