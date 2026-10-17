import ConnectionStatus from "@/app/ConnectionStatus";

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
        <form className="shorten-form">
          <label htmlFor="fullUrl">Long URL</label>
          <div className="form-row">
            <input id="fullUrl" name="fullUrl" type="url" placeholder="https://example.com/your-long-link" />
            <button type="button" disabled>Create short link</button>
          </div>
          <p className="setup-note">Connection status checks the API every five seconds.</p>
        </form>
      </section>
      <footer>API and frontend are separate apps, connected through the REST contract.</footer>
    </main>
  );
}
