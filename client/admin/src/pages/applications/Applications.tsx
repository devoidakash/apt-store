import { useEffect, useState } from "react";
import axios from "axios";
import {
  BadgeCheck,
  Database,
  FileText,
  LayoutGrid,
  LoaderCircle,
  Package,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import Layout from "../../components/dashboard/Layout";
import {
  getApplications,
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
        to: "/applications?applicationStatus=live",
        label: "Live",
        icon: BadgeCheck,
      },
    ],
  },
];

export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("applicationStatus");
  const status: ApplicationStatus = rawStatus === "live" ? "live" : "draft";
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (rawStatus !== "draft" && rawStatus !== "live") {
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

  return (
    <Layout
      sidebarLinks={sidebarLinks}
      searchPlaceholder="Search applications..."
    >
      <section className="w-full">
        <header className="flex flex-wrap items-end justify-between gap-4 border border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Package management
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Applications
            </h1>
          </div>
          {!isLoading && !error && (
            <p className="text-sm text-slate-500">
              {applications.length} {applications.length === 1 ? "app" : "apps"}
            </p>
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
          <div className="flex min-h-48 items-center gap-3 text-sm text-slate-600">
            <LayoutGrid className="h-6 w-6 text-slate-400" aria-hidden="true" />
            No {status} applications.
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
                      <Package className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="wrap-break-word text-base font-semibold text-slate-900">
                        {application.displayName || application.packageName}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Version {application.version}
                        {application.category
                          ? ` · ${application.category}`
                          : ""}
                      </p>
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
