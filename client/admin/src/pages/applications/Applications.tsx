import { useEffect, useState } from "react";
import axios from "axios";
import {
  BadgeCheck,
  Database,
  FileText,
  LayoutGrid,
  LoaderCircle,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import Layout from "../../components/dashboard/Layout";
import {
  getApplications,
  getApplicationicon,
  type ApplicationStatus,
  type ApplicationSummary,
} from "../../api/application";

const sidebarLinks = [
  {
    to: "/repositories",
    label: "Repositories",
    icon: Database,
    end: false,
  },
  {
    to: "/applications",
    label: "Applications",
    icon: LayoutGrid,
    end: false,
    children: [
      {
        to: "/applications?applicationStatus=draft",
        label: "Draft",
        icon: FileText,
      },
      {
        to: "/applications?applicationStatus=published",
        label: "Published",
        icon: BadgeCheck,
      },
    ],
  },
];

export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("applicationStatus");
  const status: ApplicationStatus =
    rawStatus === "published" ? "published" : "draft";
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (rawStatus !== "draft" && rawStatus !== "published") {
      setSearchParams({ applicationStatus: "draft" }, { replace: true });
    }
  }, [rawStatus, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      setIsLoading(true);
      setError("");

      try {
        setApplications(await getApplications(status, controller.signal));
      } catch (loadError) {
        if (controller.signal.aborted) return;

        const message = axios.isAxiosError<{ message?: string }>(loadError)
          ? (loadError.response?.data?.message ?? loadError.message)
          : loadError instanceof Error
            ? loadError.message
            : "Could not load applications.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadApplications();
    return () => controller.abort();
  }, [status]);

  const StatusIcon = status === "published" ? BadgeCheck : FileText;
  const statusPillClassName =
    status === "published"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <Layout
      sidebarLinks={sidebarLinks}
      searchPlaceholder="Search applications..."
    >
      <section className="w-full">
        <header className="flex flex-wrap items-end justify-between gap-4 border border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Manage applications
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Applications
            </h1>
          </div>
          {!isLoading && !error && (
            <span
              className={`inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium ${statusPillClassName}`}
            >
              <StatusIcon className="h-4 w-4" aria-hidden="true" />
              <span>{applications.length}</span>
              <span className="capitalize">{status}</span>
            </span>
          )}
        </header>

        {isLoading ? (
          <div className="flex min-h-48 items-center text-sm text-slate-600">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Loading {status} applications...
          </div>
        ) : error ? (
          <p role="alert" className="py-8 text-sm text-rose-700">
            {error}
          </p>
        ) : applications.length === 0 ? (
          <div className="relative min-h-[calc(100vh-14rem)]">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-lg font-medium text-slate-600">
              <LayoutGrid
                className="h-16 w-16 text-slate-300"
                aria-hidden="true"
              />
              <p>No {status} applications.</p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">
            {applications.map((application) => (
              <li key={application.id}>
                <Link
                  to={`/applications/${application.id}`}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  aria-label={`View ${application.displayName || application.packageName}`}
                >
                  <article className="flex min-h-24 items-center gap-4 border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-600">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-emerald-700">
                      {application.icon ? (
                        <img
                          src={getApplicationicon(application.icon)}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Package className="h-6 w-6" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="wrap-break-word text-base font-semibold text-slate-900">
                        {application.displayName || application.packageName}
                      </h2>
                      {application.maintainer && (
                        <p className="mt-0.5 flex items-center gap-1 wrap-break-word text-xs text-slate-600">
                          {application.maintainer}
                          <ShieldCheck
                            className="h-4 w-4 shrink-0 text-emerald-600"
                            aria-label="Verified maintainer"
                          />
                        </p>
                      )}
                      {application.caption && (
                        <p className="mt-1 wrap-break-word text-sm text-slate-600">
                          {application.caption}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}
