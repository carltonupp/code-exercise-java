"use client";

import { useState } from "react";
import ConnectionStatus from "@/app/ConnectionStatus";
import ShortLinkList from "@/app/ShortLinkList";
import ShortLinkForm from "@/app/ShortLinkForm";

export default function Home() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <main className="page-shell">
      <ConnectionStatus />
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">URL SHORTENER</p>
        <h1 id="page-title">A little less link.</h1>
        <p className="description">
          Create a short link, then find and share it here whenever you need it.
        </p>
        <a className="links-shortcut" href="#links-title">View existing links ↓</a>
        <ShortLinkForm onCreated={() => setRefreshToken((current) => current + 1)} />
      </section>
      <ShortLinkList key={refreshToken} refreshToken={refreshToken} />
      <footer>API and frontend are separate apps, connected through the REST contract.</footer>
    </main>
  );
}
