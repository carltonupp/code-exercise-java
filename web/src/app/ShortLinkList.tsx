"use client";

import { useEffect, useState } from "react";
import type { Problem, UrlEntry } from "@/api";

type LinkListResponse = {
  items: UrlEntry[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

function isLinkListResponse(value: unknown): value is LinkListResponse {
  return (
    typeof value === "object" && value !== null &&
    "items" in value && Array.isArray(value.items) &&
    "currentPage" in value && Number.isInteger(value.currentPage) &&
    "totalPages" in value && Number.isInteger(value.totalPages) &&
    "totalItems" in value && Number.isInteger(value.totalItems) &&
    "pageSize" in value && Number.isInteger(value.pageSize)
  );
}

function problemDetail(value: unknown) {
  if (typeof value === "object" && value !== null && "detail" in value &&
    typeof value.detail === "string") {
    return (value as Problem).detail;
  }
  return "The link list could not be loaded. Please try again.";
}

export default function ShortLinkList({ refreshToken = 0 }: { refreshToken?: number }) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<LinkListResponse | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingAlias, setDeletingAlias] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLinks() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/urls?page=${page}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (!response.ok) {
          setError(problemDetail(body));
          setResult(null);
          return;
        }
        if (!isLinkListResponse(body)) {
          setError("The link service returned an unexpected response.");
          setResult(null);
          return;
        }
        setResult(body);
      } catch {
        if (!controller.signal.aborted) {
          setError("The link list is unavailable. Please try again.");
          setResult(null);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadLinks();
    return () => controller.abort();
  }, [page, refreshToken, reloadToken]);

  async function deleteLink(alias: string) {
    setDeletingAlias(alias);
    setActionError("");
    setNotice("");
    try {
      const response = await fetch(`/api/urls/${encodeURIComponent(alias)}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (response.status !== 204) {
        const body: unknown = await response.json().catch(() => null);
        setActionError(problemDetail(body));
        return;
      }
      setNotice(`Deleted ${alias}.`);
      setReloadToken((current) => current + 1);
    } catch {
      setActionError("The link could not be deleted. Please try again.");
    } finally {
      setDeletingAlias("");
    }
  }

  return (
    <section className="link-list" aria-labelledby="view-links">
      <div className="link-list-heading">
        <div>
          <p className="eyebrow">YOUR LINKS</p>
          <h2 id="view-links">Active short links</h2>
        </div>
        {result && <p className="result-count" aria-live="polite">
          {result.totalItems} {result.totalItems === 1 ? "result" : "results"}
        </p>}
      </div>

      {isLoading && <p className="list-message" role="status">Loading links…</p>}
      {error && <p className="list-error" role="alert">{error}</p>}
      {actionError && <p className="list-error" role="alert">{actionError}</p>}
      {notice && <p className="list-success" role="status">{notice}</p>}
      {!isLoading && !error && result?.totalItems === 0 && (
        <div className="empty-links">
          <h3>No active links yet</h3>
          <p>Create a short link above and it will appear here.</p>
          <a href="#create-link">Create a link</a>
        </div>
      )}
      {!isLoading && !error && result && result.totalItems > 0 && (
        <>
          <ul className="link-entries">
            {result.items.map((link) => (
              <li className="link-entry" key={link.alias}>
                <div className="link-entry-alias">
                  <span>Alias</span>
                  <strong>{link.alias}</strong>
                </div>
                <div className="link-entry-value">
                  <span>Short link</span>
                  <a href={link.shortUrl}>{link.shortUrl}</a>
                </div>
                <div className="link-entry-value destination-value">
                  <span>Destination</span>
                  <a href={link.fullUrl} target="_blank" rel="noreferrer">{link.fullUrl}</a>
                </div>
                <div className="link-entry-actions">
                  <button
                    type="button"
                    className="delete-link-button"
                    onClick={() => void deleteLink(link.alias)}
                    disabled={Boolean(deletingAlias) || isLoading}
                  >
                    {deletingAlias === link.alias ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <nav className="pagination" aria-label="Link list pages">
            <button
              type="button"
              className="pagination-button"
              onClick={() => setPage(result.currentPage - 1)}
              disabled={isLoading || result.currentPage <= 1}
            >
              Previous
            </button>
            <span aria-live="polite">Page {result.currentPage} of {result.totalPages}</span>
            <button
              type="button"
              className="pagination-button"
              onClick={() => setPage(result.currentPage + 1)}
              disabled={isLoading || result.currentPage >= result.totalPages}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
