import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Database, LoaderCircle } from "lucide-react";
import { Link, useParams } from "react-router";
import Layout from "../components/dashboard/Layout";
import { getRepositoryById, type RepositoryDetail } from "../api/repository";

const sidebarLinks = [
  {
    to: "/repositories",
    label: "Repositories",
    icon: Database,
  },
];

export default function ManageRepository() {
  const { repositoryId } = useParams();
  const [repository, setRepository] = useState<RepositoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRepository() {
      setIsLoading(true);
      setError("");

      try {
        if (!repositoryId) {
          setError("Repository ID is missing.");
          return;
        }

        const result = await getRepositoryById(repositoryId, controller.signal);
        if (!result) {
          setError("Repository not found.");
          return;
        }
        setRepository(result);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        const message = axios.isAxiosError<{ message?: string }>(loadError)
          ? (loadError.response?.data?.message ?? loadError.message)
          : loadError instanceof Error
            ? loadError.message
            : "Could not load this repository.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadRepository();
    return () => controller.abort();
  }, [repositoryId]);

  const details = repository
    ? [
        { label: "Package names", value: repository.packageName.join(", ") },
        { label: "Repository URL", value: repository.uri },
        { label: "Suite", value: repository.suite },
        { label: "Component", value: repository.component },
        { label: "Architecture", value: repository.architecture },
        { label: "Signing key", value: repository.signedby },
        {
          label: "Created",
          value: new Date(repository.createdAt).toLocaleString(),
        },
        {
          label: "Last updated",
          value: new Date(repository.updatedAt).toLocaleString(),
        },
      ]
    : [];

  return (
    <Layout
      sidebarLinks={sidebarLinks}
      searchPlaceholder="Search repositories..."
    >
      <section className="w-full">
        <Link
          to="/repositories"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to repositories
        </Link>

        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Package management
          </p>
          <h1 className="mt-2 wrap-break-word text-2xl font-semibold text-slate-950">
            {repository?.name ?? "Manage repository"}
          </h1>
        </header>

        {isLoading ? (
          <div className="flex min-h-48 items-center text-sm text-slate-600">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Loading repository...
          </div>
        ) : error ? (
          <p role="alert" className="py-8 text-sm text-rose-700">
            {error}
          </p>
        ) : (
          <dl className="grid gap-x-8 sm:grid-cols-2">
            {details.map(({ label, value }) => (
              <div key={label} className="border-b border-slate-200 py-4">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-900">
                  {value || "-"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </Layout>
  );
}
