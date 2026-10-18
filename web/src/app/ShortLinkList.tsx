"use client";

import type { ShortLinksState } from "@/features/short-links/useShortLinks";

export default function ShortLinkList({ links }: { links: ShortLinksState }) {
  const {
    result, error, actionError, notice, deletingAlias, isLoading, changePage, deleteLink,
  } = links;

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
              onClick={() => changePage(result.currentPage - 1)}
              disabled={isLoading || result.currentPage <= 1}
            >
              Previous
            </button>
            <span aria-live="polite">Page {result.currentPage} of {result.totalPages}</span>
            <button
              type="button"
              className="pagination-button"
              onClick={() => changePage(result.currentPage + 1)}
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
