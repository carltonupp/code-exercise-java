"use client";

import { useState } from "react";
import type { ValidationError } from "@/api";
import { createShortLink, ShortLinkRequestError } from "./api";
import { isValidAlias, normalizeDestination } from "./validation";

export function useCreateShortLink(onCreated?: () => void) {
  const [fullUrl, setFullUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function create() {
    setError("");
    setFieldErrors([]);
    setShortUrl("");
    const destination = normalizeDestination(fullUrl);
    const alias = customAlias.trim();
    if (!destination) {
      setFieldErrors([
        { field: "fullUrl", message: "Enter a complete web address, such as https://example.com." },
      ]);
      return;
    }
    if (alias && !isValidAlias(alias)) {
      setError("Custom aliases must be 3–16 letters, numbers, or hyphens.");
      return;
    }

    setFullUrl(destination);
    setIsSubmitting(true);
    try {
      const result = await createShortLink({
        fullUrl: destination, ...(alias ? { customAlias: alias } : {}),
      });
      setShortUrl(result.shortUrl);
      setFullUrl("");
      setCustomAlias("");
      onCreated?.();
    } catch (failure) {
      if (failure instanceof ShortLinkRequestError) {
        switch (failure.problem?.type) {
          case "urn:urlshortener:problem:alias-in-use":
            setError("That alias is unavailable. Choose another one.");
            break;
          case "urn:urlshortener:problem:validation-failed":
            setFieldErrors(failure.problem.errors ?? []);
            setError(failure.message);
            break;
          default:
            setError(failure.message);
        }
      } else {
        setError("The short link service is unavailable. Your entries are still here; try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateFullUrl(value: string) {
    setFullUrl(value);
    setFieldErrors((errors) => errors.filter((error) => error.field !== "fullUrl"));
  }

  function updateCustomAlias(value: string) {
    setCustomAlias(value);
    setFieldErrors((errors) => errors.filter((error) => error.field !== "customAlias"));
  }

  return {
    fullUrl, customAlias, shortUrl, error, fieldErrors, isSubmitting,
    updateFullUrl, updateCustomAlias, create,
  };
}
