"use client";

import { useShortLinks } from "@/features/short-links/useShortLinks";
import ConnectionStatus from "@/app/ConnectionStatus";
import ShortLinkList from "@/app/ShortLinkList";
import ShortLinkForm from "@/app/ShortLinkForm";

export default function Home() {
  const links = useShortLinks();

  return (
    <main className="page-shell">
      <ConnectionStatus />
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">URL SHORTENER</p>
        <h1 id="page-title">A little less link.</h1>
        <p className="description">
          Create a short link, then find and share it here whenever you need it.
        </p>
        <a className="links-shortcut" href="#view-links">View existing links ↓</a>
        <ShortLinkForm onCreated={links.refreshFromFirstPage} />
      </section>
      <ShortLinkList links={links} />
    </main>
  );
}
