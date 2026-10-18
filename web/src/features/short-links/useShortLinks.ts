"use client";

import { useEffect, useRef, useState } from "react";
import { deleteShortLink, listShortLinks, ShortLinkRequestError } from "./api";
import type { LinkListResponse } from "./types";

export function useShortLinks() {
  const [query, setQuery] = useState({ page: 1, revision: 0 });
  const currentPage = useRef(1);
  const [result, setResult] = useState<LinkListResponse | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingAlias, setDeletingAlias] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLinks() {
      setIsLoading(true);
      setError("");
      try {
        const body = await listShortLinks(query.page, controller.signal);
        if (controller.signal.aborted) return;
        currentPage.current = body.currentPage;
        setResult(body);
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure instanceof ShortLinkRequestError
            ? failure.message : "The link list is unavailable. Please try again.");
          setResult(null);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadLinks();
    return () => controller.abort();
  }, [query]);

  function changePage(page: number) {
    currentPage.current = page;
    setQuery((previous) => ({ page, revision: previous.revision + 1 }));
  }

  function refreshFromFirstPage() {
    currentPage.current = 1;
    setActionError("");
    setNotice("");
    setQuery((previous) => ({ page: 1, revision: previous.revision + 1 }));
  }

  async function deleteLink(alias: string) {
    setDeletingAlias(alias);
    setActionError("");
    setNotice("");
    try {
      await deleteShortLink(alias);
      setNotice(`Deleted ${alias}.`);
      setQuery((previous) => ({ page: currentPage.current, revision: previous.revision + 1 }));
    } catch (failure) {
      setActionError(failure instanceof ShortLinkRequestError
        ? failure.message : "The link could not be deleted. Please try again.");
    } finally {
      setDeletingAlias("");
    }
  }

  return {
    result, error, actionError, notice, deletingAlias, isLoading,
    changePage, refreshFromFirstPage, deleteLink,
  };
}

export type ShortLinksState = ReturnType<typeof useShortLinks>;
