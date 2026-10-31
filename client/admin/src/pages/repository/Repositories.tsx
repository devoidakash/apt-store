import { useEffect, useState } from "react";
import axios from "axios";
import {
  BadgeCheck,
  LayoutGrid,
  Database,
  FileText,
  LoaderCircle,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import Layout from "../../components/dashboard/Layout";
import {
  getRepositories,
  type Repository,
  type RepositoryApplicationStatus,
} from "../../api/repository";

const sidebarLinks = [
  {
    to: "/repositories",
    label: "Repositories",
    icon: Database,
    end: false,
    children: [
      {
        to: "/repositories?applicationStatus=draft",
        label: "Draft",
        icon: FileText,
      },
      {
        to: "/repositories?applicationStatus=published",
        label: "Published",
        icon: BadgeCheck,
      },
    ],
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

export default function Repositories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("applicationStatus");
  const status: RepositoryApplicationStatus =
    rawStatus === "published" ? "published" : "draft";
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (rawStatus !== "draft" && rawStatus !== "published") {
      setSearchParams({ applicationStatus: "draft" }, { replace: true });
    }
  }, [rawStatus, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRepositories() {
      setIsLoading(true);
      setError("");

      try {
        setRepositories(await getRepositories(status, controller.signal));
      } catch (loadError) {
        if (controller.signal.aborted) return;

        const message = axios.isAxiosError<{ message?: string }>(loadError)
          ? (loadError.response?.data?.message ?? loadError.message)
          : loadError instanceof Error
            ? loadError.message
            : "Could not load repositories.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadRepositories();
    return () => controller.abort();
  }, [reloadKey, status]);

  const StatusIcon = status === "published" ? BadgeCheck : FileText;
  const statusPillClassName =
    status === "published"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <Layout
      sidebarLinks={sidebarLinks}
      searchPlaceholder="Search repositories..."
    >
      <section className="w-full">
        <header className="flex flex-wrap items-end justify-between gap-4 border border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Manage repositories
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Repositories
            </h1>
          </div>
          {!isLoading && !error && (
            <span
              className={`inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium ${statusPillClassName}`}
            >
              <StatusIcon className="h-4 w-4" aria-hidden="true" />
              <span>{repositories.length}</span>
              <span className="capitalize">{status}</span>
            </span>
          )}
        </header>

        <ul className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">
          <li>
            <Link
              to="/repositories/new"
              className="flex min-h-24 items-center gap-4 border border-dashed border-emerald-700 bg-white p-5 text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50">
                <Plus className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold">Add repositories</span>
            </Link>
          </li>

          {isLoading ? (
            <li className="flex min-h-24 items-center text-sm text-slate-600">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Loading {status} repositories...
            </li>
          ) : error ? (
            <li
              role="alert"
              className="flex flex-wrap items-center gap-4 text-sm sm:col-span-2 xl:col-span-3"
            >
              <p className="text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Try again
              </button>
            </li>
          ) : repositories.length === 0 ? (
            <li className="flex min-h-24 items-center text-sm text-slate-600">
              No {status} repositories.
            </li>
          ) : (
            repositories.map((repository) => (
              <li key={repository.id}>
                <Link
                  to={`/repositories/${repository.id}`}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  aria-label={`Manage ${repository.displayName}`}
                >
                  <article className="flex min-h-24 items-center gap-4 border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-600">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-emerald-700"
                      aria-hidden="true"
                    >
                      {repository.icon ? (
                        <img
                          src={repository.icon}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <LayoutGrid className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="wrap-break-word text-base font-semibold text-slate-900">
                        {repository.displayName}
                      </h2>
                      {repository.maintainer && (
                        <p className="mt-0.5 flex items-center gap-1 wrap-break-word text-xs text-slate-600">
                          {repository.maintainer}
                          <ShieldCheck
                            className="h-4 w-4 shrink-0 text-emerald-600"
                            aria-label="Maintainer"
                          />
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </Layout>
  );
}
