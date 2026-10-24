import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  getApplicationById,
  type ApplicationDetail as ApplicationDetailData,
} from "../api/application";
import { usePackageStatus } from "../hooks/usePackageStatus";
import type { PackageStatus } from "../types/package-status";

function formatBytes(value: number | string) {
  const bytes = Number(value);
  return Number.isFinite(bytes)
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : "-";
}

function assertNever(value: never): never {
  throw new Error(`Unhandled package status: ${value}`);
}

interface PackageActionsProps {
  status: PackageStatus;
  packageName: string;
  onRetry: () => void;
}

function PackageActions({ status, packageName, onRetry }: PackageActionsProps) {
  switch (status) {
    case "NotInstalled":
      return (
        <button
          type="button"
          className="detail-install"
          onClick={() => {
            /* TODO: implement installation */
          }}
        >
          Install <span aria-hidden="true">&#8594;</span>
        </button>
      );
    case "UpToDate":
      return (
        <div className="detail-actions">
          <button
            type="button"
            className="detail-install"
            onClick={() => {
              /* TODO: implement opening */
            }}
          >
            Open
          </button>
          <button
            type="button"
            className="detail-action"
            onClick={() => {
              /* TODO: implement uninstallation */
            }}
          >
            Uninstall
          </button>
        </div>
      );
    case "UpdateAvailable":
      return (
        <div className="detail-actions">
          <button
            type="button"
            className="detail-install"
            onClick={() => {
              /* TODO: implement update */
            }}
          >
            Update <span aria-hidden="true">&#8594;</span>
          </button>
          <button
            type="button"
            className="detail-action"
            onClick={() => {
              /* TODO: implement opening */
            }}
          >
            Open
          </button>
          <button
            type="button"
            className="detail-action"
            onClick={() => {
              /* TODO: implement uninstallation */
            }}
          >
            Uninstall
          </button>
        </div>
      );
    case "OnHold":
      return (
        <div className="detail-on-hold">
          <div className="detail-actions">
            <button
              type="button"
              className="detail-install"
              onClick={() => {
                /* TODO: implement opening */
              }}
            >
              Open
            </button>
            <button
              type="button"
              className="detail-action"
              onClick={() => {
                /* TODO: implement uninstallation */
              }}
            >
              Uninstall
            </button>
          </div>
          <div className="detail-on-hold-warning" role="status">
            This package is on hold. Run{" "}
            <code>sudo apt-mark unhold {packageName}</code> to allow updates.
          </div>
        </div>
      );
    case "InstallCheckFailed":
      return (
        <div className="detail-status-error">
          <span role="alert">We couldn't check if this app is installed.</span>
          <button type="button" className="detail-action" onClick={onRetry}>
            Try again
          </button>
        </div>
      );
    case "VersionComparisonFailed":
      return (
        <div className="detail-status-error">
          <span role="alert">
            This app is installed, but we couldn't check for updates.
          </span>
          <div className="detail-actions">
            <button
              type="button"
              className="detail-install"
              onClick={() => {
                /* TODO: implement opening */
              }}
            >
              Open
            </button>
            <button
              type="button"
              className="detail-action"
              onClick={() => {
                /* TODO: implement uninstallation */
              }}
            >
              Uninstall
            </button>
          </div>
        </div>
      );
    default:
      return assertNever(status);
  }
}

export default function ApplicationDetail() {
  const { applicationId } = useParams();
  const [searchParams] = useSearchParams();
  const packageName = searchParams.get("packageName") || "";
  const latestVersion = searchParams.get("latestVersion") || "";
  const [application, setApplication] = useState<ApplicationDetailData | null>(
    null,
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const {
    status: packageStatus,
    isLoading: isCheckingStatus,
    refetch: retryStatusCheck,
  } = usePackageStatus(packageName, latestVersion);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplication() {
      if (!applicationId) {
        setError("Application ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setApplication(null);
      try {
        const loadedApplication = await getApplicationById(
          applicationId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setApplication(loadedApplication);
        setSelectedImageIndex(0);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load application.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadApplication();
    return () => controller.abort();
  }, [applicationId]);

  const images = application?.images ?? [];

  return (
    <main className="store-shell">
      <header className="store-header">
        <Link
          to="/"
          className="brand-lockup detail-brand"
          aria-label="Back to APT Store"
        >
          <img className="brand-mark" src="/apt-store.png" alt="" />
          <div>
            <p className="brand-eyebrow">Desktop marketplace</p>
            <h1>APT Store</h1>
          </div>
        </Link>
        <span className="header-meta">
          <span className="connection-dot" aria-hidden="true" />
          Live catalog
        </span>
      </header>

      <section className="detail-page" aria-live="polite">
        <Link to="/" className="detail-back">
          &#8592; Back to applications
        </Link>
        {isLoading ? (
          <div className="catalog-state">
            <span className="loading-orbit" aria-hidden="true" />
            Loading application...
          </div>
        ) : error ? (
          <div className="catalog-state catalog-state--error" role="alert">
            <strong>Application unavailable</strong>
            <span>{error}</span>
          </div>
        ) : application ? (
          <article className="detail-card">
            <div className="detail-hero">
              <div className="detail-identity">
                <div className="detail-icon">
                  {application.icon ? (
                    <img src={application.icon} alt="" />
                  ) : (
                    <span aria-hidden="true">A</span>
                  )}
                </div>
                <div>
                  <p className="detail-package">
                    {application.packageName || "APT application"}
                  </p>
                  <h2>{application.displayName || application.packageName}</h2>
                  <p className="detail-maintainer">
                    {application.maintainer || "Community publisher"}
                    <span aria-hidden="true">&#9679;</span>
                    {application.category || "Utilities"}
                  </p>
                </div>
              </div>
              <div className="detail-button-area" aria-live="polite">
                {isCheckingStatus ? (
                  <span
                    className="detail-status-loading"
                    role="status"
                    aria-label="Checking installation status"
                  >
                    <span className="loading-orbit" aria-hidden="true" />
                  </span>
                ) : packageStatus ? (
                  <PackageActions
                    status={packageStatus}
                    packageName={packageName}
                    onRetry={retryStatusCheck}
                  />
                ) : null}
              </div>
            </div>

            <dl className="detail-stats">
              <div>
                <dt>Download size</dt>
                <dd>{formatBytes(application.downloadSizeInBytes)}</dd>
              </div>
              <div>
                <dt>Installed size</dt>
                <dd>{formatBytes(application.installedSizeInBytes)}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{application.version || "Latest"}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{application.category || "Utilities"}</dd>
              </div>
            </dl>

            <div className="detail-body">
              <section>
                <div className="detail-section-heading">
                  <p className="section-kicker">Images</p>
                  <span>{images.length} images</span>
                </div>
                {images.length > 0 ? (
                  <div className="detail-gallery">
                    <div className="detail-image-frame">
                      <img
                        src={images[selectedImageIndex]}
                        alt={`${application.displayName || "Application"} image ${selectedImageIndex + 1}`}
                      />
                    </div>
                    <div className="detail-gallery-controls">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex((currentIndex) =>
                            currentIndex === 0
                              ? images.length - 1
                              : currentIndex - 1,
                          )
                        }
                        disabled={images.length < 2}
                        aria-label="Previous image"
                      >
                        &#8592; Previous
                      </button>
                      <span>
                        {selectedImageIndex + 1} / {images.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex((currentIndex) =>
                            currentIndex === images.length - 1
                              ? 0
                              : currentIndex + 1,
                          )
                        }
                        disabled={images.length < 2}
                        aria-label="Next image"
                      >
                        Next &#8594;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="detail-empty-images">No images uploaded</div>
                )}
              </section>
              <section className="detail-description-section">
                <p className="section-kicker">About this application</p>
                <p className="detail-description">
                  {application.description ||
                    application.caption ||
                    "No description available."}
                </p>
                {application.homepage && (
                  <a
                    className="detail-link"
                    href={application.homepage}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit developer website{" "}
                    <span aria-hidden="true">&#8599;</span>
                  </a>
                )}
              </section>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
