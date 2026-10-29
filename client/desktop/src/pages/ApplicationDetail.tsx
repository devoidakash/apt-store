import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
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

const OPEN_ERROR_MESSAGES: Record<string, string> = {
  invalidInput: "This application cannot be opened.",
  notInstalled: "This application is no longer installed.",
  noLauncherFound: "No desktop launcher was found for this application.",
  launchFailed: "This application could not be started.",
};

function openErrorCode(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

function describeOpenError(error: unknown): string {
  return (
    OPEN_ERROR_MESSAGES[openErrorCode(error)] ??
    "This application could not be opened."
  );
}

type RepositoryCommand = "install_packages" | "update_packages";

type RepositoryCommandResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "error"; message: string };

async function runRepositoryCommand(
  command: RepositoryCommand,
  repository: Repository | null,
): Promise<RepositoryCommandResult> {
  if (!repository) {
    return { status: "error", message: "Repository information is missing." };
  }

  try {
    await invoke(command, { repository });
    return { status: "success" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();

    if (normalized.includes("cancelled") || normalized === '"cancelled"') {
      return { status: "cancelled" };
    }

    return { status: "error", message };
  }
}

interface Repository {
  packageName: string;
  uri: string;
  suite: string;
  component: string | null;
  keyContent: string;
}

interface PackageActionsProps {
  status: PackageStatus;
  packageName: string;
  onRetry: () => void;
  repository: Repository | null;
  onActionComplete: () => void;
}

function PackageActions({
  status,
  packageName,
  onRetry,
  repository,
  onActionComplete,
}: PackageActionsProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [openError, setOpenError] = useState("");

  const handleInstall = async () => {
    setIsInstalling(true);
    setInstallError("");
    try {
      const result = await runRepositoryCommand("install_packages", repository);
      if (result.status === "success") onActionComplete();
      else if (result.status === "error") setInstallError(result.message);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateError("");
    try {
      const result = await runRepositoryCommand("update_packages", repository);
      if (result.status === "success") onActionComplete();
      else if (result.status === "error") setUpdateError(result.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpen = async () => {
    if (!packageName.trim()) {
      setOpenError("Package name is missing.");
      return;
    }

    setIsOpening(true);
    setOpenError("");
    try {
      await invoke("open_app", { packageName });
    } catch (error) {
      setOpenError(describeOpenError(error));
      if (openErrorCode(error) === "notInstalled") onRetry();
    } finally {
      setIsOpening(false);
    }
  };

  const renderOpenButton = (className: string) => (
    <button
      type="button"
      className={className}
      onClick={handleOpen}
      disabled={isOpening}
    >
      {isOpening ? "Opening..." : "Open"}
    </button>
  );

  const openErrorAlert = openError ? (
    <span className="detail-inline-error" role="alert">
      {openError}
    </span>
  ) : null;

  const updateErrorAlert = updateError ? (
    <span className="detail-inline-error" role="alert">
      {updateError}
    </span>
  ) : null;

  switch (status) {
    case "NotInstalled":
      return (
        <div className="detail-install-group">
          <button
            type="button"
            className="detail-install"
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? "Installing..." : "Install"}
            {!isInstalling && <span aria-hidden="true">&#8594;</span>}
          </button>
          {installError && (
            <span className="detail-inline-error" role="alert">
              {installError}
            </span>
          )}
        </div>
      );
    case "Installed":
      return (
        <div className="detail-open-panel">
          <div className="detail-actions">
            {renderOpenButton("detail-install")}
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
          {openErrorAlert}
        </div>
      );
    case "UpdateAvailable":
      return (
        <div className="detail-open-panel">
          <div className="detail-actions">
            <button
              type="button"
              className="detail-install"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update"}
              {!isUpdating && <span aria-hidden="true">&#8594;</span>}
            </button>
            {renderOpenButton("detail-action")}
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
          {updateErrorAlert}
          {openErrorAlert}
        </div>
      );
    case "OnHold":
      return (
        <div className="detail-on-hold">
          <div className="detail-actions">
            {renderOpenButton("detail-install")}
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
          {openErrorAlert}
          <div className="detail-on-hold-warning" role="status">
            This package is on hold. Run{" "}
            <code>sudo apt-mark unhold {packageName}</code> to allow updates.
          </div>
        </div>
      );
    case "Error":
      return (
        <div className="detail-status-error">
          <span role="alert">We couldn't determine this app's status.</span>
          <button type="button" className="detail-action" onClick={onRetry}>
            Try again
          </button>
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
  const [repository, setRepository] = useState<Repository | null>(null);
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
        const loaded = await getApplicationById(
          applicationId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setApplication(loaded.application);
        setRepository(loaded.repository);
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
  const resolvedPackageName = packageName || application?.packageName || "";

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
                    packageName={resolvedPackageName}
                    onRetry={retryStatusCheck}
                    repository={repository}
                    onActionComplete={retryStatusCheck}
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
