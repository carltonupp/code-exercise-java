"use client";

import { FormEvent, useState } from "react";
import type { Problem, ShortenResponse, ValidationError } from "@/api";

function normalizeDestination(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedValue);
  const candidate = hasScheme ? trimmedValue : `https://${trimmedValue}`;
  try {
    const url = new URL(candidate);
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export default function ShortLinkForm({ onCreated }: { onCreated?: () => void }) {
  const [fullUrl, setFullUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const urlError = fieldErrors
    .filter((error) => error.field === "fullUrl")
    .map((error) => error.message)
    .join(" ");
  const aliasError = fieldErrors
    .filter((error) => error.field === "customAlias")
    .map((error) => error.message)
    .join(" ");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors([]);
    setShortUrl("");
    setCopied(false);

    const destination = normalizeDestination(fullUrl);
    const alias = customAlias.trim();
    if (!destination) {
      setError("Enter a valid HTTP or HTTPS URL.");
      return;
    }
    if (alias && !/^[A-Za-z0-9-]{3,16}$/.test(alias)) {
      setError("Custom aliases must be 3–16 letters, numbers, or hyphens.");
      return;
    }

    setFullUrl(destination);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullUrl: destination, ...(alias ? { customAlias: alias } : {}) }),
      });
      if (!response.ok) {
        const problem = await response.json() as Problem;
        switch (problem.type) {
          case "urn:urlshortener:problem:alias-in-use":
            setError("That alias is already in use. Choose another one.");
            break;
          case "urn:urlshortener:problem:validation-failed":
            setFieldErrors(problem.errors ?? []);
            setError(problem.detail);
            break;
          default:
            setError(problem.detail || "The short link could not be created. Please try again.");
        }
        return;
      }
      if (response.status !== 201) {
        setError("The service returned an unexpected response. Please try again.");
        return;
      }
      const result = await response.json() as ShortenResponse;
      setShortUrl(result.shortUrl);
      setFullUrl("");
      setCustomAlias("");
      onCreated?.();
    } catch {
      setError("The short link service is unavailable. Your entries are still here; try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyShortUrl() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
    } catch {
      setError("Could not copy the short link. You can select and copy it manually.");
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
            onChange={(event) => {
              setFullUrl(event.target.value);
              setFieldErrors((errors) => errors.filter((error) => error.field !== "fullUrl"));
            }}
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
            onChange={(event) => {
              setCustomAlias(event.target.value);
              setFieldErrors((errors) => errors.filter((error) => error.field !== "customAlias"));
            }}
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
        <p className="setup-note">Connection status checks the API every five seconds.</p>
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
