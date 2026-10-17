import ConnectionStatus from "@/app/ConnectionStatus";
import ShortLinkForm from "@/app/ShortLinkForm";

export default function Home() {
  return (
    <main className="page-shell">
      <ConnectionStatus />
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">URL SHORTENER</p>
        <h1 id="page-title">A little less link.</h1>
        <p className="description">
          Your link management workspace is ready. Create a short link to get started.
        </p>
        <ShortLinkForm />
      </section>
      <footer>API and frontend are separate apps, connected through the REST contract.</footer>
    </main>
  );
}
