import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications, type ApplicationSummary } from "../api/application";

function ApplicationCard({ application }: { application: ApplicationSummary }) {
  return (
    <Link
      to={`/applications/${application.id}?packageName=${encodeURIComponent(application.packageName || "")}&latestVersion=${encodeURIComponent(application.version || "")}`}
      className="application-card"
      aria-label={`View ${application.displayName || application.packageName || "application"}`}
    >
      <div className="application-card__topline">
        <span className="application-card__status">Available</span>
        <span className="application-card__version">
          {application.version ? `v${application.version}` : "Latest"}
        </span>
      </div>
      <div className="application-card__identity">
        <div className="application-card__icon">
          {application.icon ? (
            <img src={application.icon} alt="" />
          ) : (
            <span aria-hidden="true">A</span>
          )}
        </div>
        <div className="application-card__title-group">
          <h2>
            {application.displayName ||
              application.packageName ||
              "Application"}
          </h2>
          <p>{application.maintainer || "Community publisher"}</p>
        </div>
      </div>
      <p className="application-card__caption">
        {application.caption || "A trusted application from the APT Store."}
      </p>
      <span className="application-card__action">
        View application <span aria-hidden="true">&#8594;</span>
      </span>
    </Link>
  );
}

export default function Applications() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      try {
        setIsLoading(true);
        setError("");
        setApplications(await getApplications(controller.signal));
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load applications.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadApplications();
    return () => controller.abort();
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return applications;

    return applications.filter((application) =>
      [application.displayName, application.packageName, application.maintainer]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery)),
    );
  }, [applications, query]);

  return (
    <main className="store-shell">
      <header className="store-header">
        <div className="brand-lockup">
          <img className="brand-mark" src="/apt-store.png" alt="" />
          <div>
            <p className="brand-eyebrow">Desktop marketplace</p>
            <h1>APT Store</h1>
          </div>
        </div>
        <div className="header-meta">
          <span className="connection-dot" aria-hidden="true" />
          Live catalog
        </div>
      </header>

      <section className="catalog-hero">
        <div>
          <p className="section-kicker">Curated for Debian</p>
          <h2>Find your next essential application.</h2>
          <p className="catalog-hero__copy">
            Browse the live APT catalog and discover software ready for your
            desktop.
          </p>
        </div>
        <label className="catalog-search">
          <span aria-hidden="true">&#9906;</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applications"
            aria-label="Search applications"
          />
          <kbd>/</kbd>
        </label>
      </section>

      <section className="catalog-content" aria-live="polite">
        <div className="catalog-heading">
          <div>
            <p className="section-kicker">Application catalog</p>
            <h2>Live applications</h2>
          </div>
          <span className="catalog-count">
            {filteredApplications.length} available
          </span>
        </div>

        {isLoading ? (
          <div className="catalog-state">
            <span className="loading-orbit" aria-hidden="true" />
            Loading the catalog...
          </div>
        ) : error ? (
          <div className="catalog-state catalog-state--error" role="alert">
            <strong>Catalog unavailable</strong>
            <span>{error}</span>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="catalog-state">
            <strong>No applications found</strong>
            <span>Try a different search.</span>
          </div>
        ) : (
          <div className="application-grid">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
