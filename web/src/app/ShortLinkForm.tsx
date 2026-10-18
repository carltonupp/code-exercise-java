"use client";

import { FormEvent, useState } from "react";
import { useCreateShortLink } from "@/features/short-links/useCreateShortLink";

export default function ShortLinkForm({ onCreated }: { onCreated?: () => void }) {
  const {
    fullUrl, customAlias, shortUrl, error: requestError, fieldErrors, isSubmitting,
    updateFullUrl, updateCustomAlias, create,
  } = useCreateShortLink(onCreated);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const error = copyError || requestError;
  const urlError = fieldErrors
    .filter((error) => error.field === "fullUrl")
    .map((error) => error.message)
    .join(" ");
  const aliasError = fieldErrors
    .filter((error) => error.field === "customAlias")
    .map((error) => error.message)
    .join(" ");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setCopyError("");
    void create();
  }

  async function copyShortUrl() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
    } catch {
      setCopyError("Could not copy the short link. You can select and copy it manually.");
    }
  }

  return (
    <>
      <form id="create-link" className="shorten-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <div className="form-field">
          <label htmlFor="fullUrl">Long URL</label>
          <input
            id="fullUrl"
            name="fullUrl"
            type="url"
            autoComplete="url"
            placeholder="https://example.com/your-long-link"
            value={fullUrl}
            onChange={(event) => updateFullUrl(event.target.value)}
            required
            aria-invalid={Boolean(urlError)}
            aria-describedby={`url-help${urlError ? " url-error" : ""}`}
          />
          <p id="url-help" className="field-help">Enter the page you want your short link to open.</p>
          {urlError && <p id="url-error" className="form-error">{urlError}</p>}
        </div>
        <div className="form-field alias-field">
          <label htmlFor="customAlias">Custom alias <span>(optional)</span></label>
          <input
            id="customAlias"
            name="customAlias"
            type="text"
            autoComplete="off"
            minLength={3}
            maxLength={16}
            pattern="[A-Za-z0-9-]{3,16}"
            placeholder="your-alias"
            value={customAlias}
            onChange={(event) => updateCustomAlias(event.target.value)}
            aria-invalid={Boolean(aliasError)}
            aria-describedby={`alias-help${aliasError ? " alias-error" : ""}`}
          />
          <p id="alias-help" className="field-help">3–16 letters, numbers, or hyphens. Leave blank to generate one.</p>
          {aliasError && <p id="alias-error" className="form-error">{aliasError}</p>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create short link"}
          </button>
        </div>
      </form>
      {shortUrl && (
        <section className="short-link-result" aria-labelledby="result-title" aria-live="polite">
          <div>
            <h2 id="result-title">Your short link is ready</h2>
            <output>{shortUrl}</output>
          </div>
          <button type="button" className="copy-button" onClick={copyShortUrl}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </section>
      )}
    </>
  );
}
