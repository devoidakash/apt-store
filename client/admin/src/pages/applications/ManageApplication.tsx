import { useEffect, useState } from "react";
import axios from "axios";
import {
  BadgeCheck,
  Boxes,
  Database,
  FileText,
  LoaderCircle,
} from "lucide-react";
import { Link, useParams } from "react-router";
import Layout from "../../components/dashboard/Layout";
import {
  getApplicationById,
  type ApplicationDetail,
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
    icon: Boxes,
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

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatBytes(value: number | string) {
  const bytes = Number(value);
  return Number.isFinite(bytes) ? `${bytes.toLocaleString()} bytes` : "-";
}

export default function ManageApplication() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState<ApplicationDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplication() {
      setIsLoading(true);
      setError("");

      try {
        if (!applicationId) {
          setError("Application ID is missing.");
          return;
        }

        setApplication(
          await getApplicationById(applicationId, controller.signal),
        );
      } catch (loadError) {
        if (controller.signal.aborted) return;

        const message = axios.isAxiosError<{ message?: string }>(loadError)
          ? (loadError.response?.data?.message ?? loadError.message)
          : loadError instanceof Error
            ? loadError.message
            : "Could not load this application.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadApplication();
    return () => controller.abort();
  }, [applicationId]);

  const details = application
    ? [
        { label: "Package name", value: application.packageName },
        { label: "Display name", value: application.displayName },
        { label: "Version", value: application.version },
        { label: "Status", value: application.status },
        { label: "Category", value: application.category },
        { label: "Description", value: application.description },
        { label: "Homepage", value: application.homepage },
        { label: "Maintainer", value: application.maintainer },
        { label: "Repository ID", value: application.repositoryId },
        {
          label: "Download size",
          value: formatBytes(application.downloadSizeBytes),
        },
        {
          label: "Installed size",
          value: formatBytes(application.installedSizeBytes),
        },
        { label: "Has icon", value: application.hasIcon ? "Yes" : "No" },
        { label: "Images", value: application.images.join(", ") || null },
        { label: "Created", value: formatDate(application.createdAt) },
        { label: "Last updated", value: formatDate(application.updatedAt) },
        {
          label: "Missing since",
          value: formatDate(application.missingSince),
        },
      ]
    : [];

  return (
    <Layout
      sidebarLinks={sidebarLinks}
      searchPlaceholder="Search applications..."
    >
      <section className="w-full">
        <Link
          to={`/applications?applicationStatus=${application?.status ?? "draft"}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          Back to applications
        </Link>

        <header className="border border-slate-200 bg-white px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Application management
          </p>
          <h1 className="mt-2 wrap-break-word text-2xl font-semibold text-slate-950">
            {application?.displayName ||
              application?.packageName ||
              "Application"}
          </h1>
        </header>

        {isLoading ? (
          <div className="flex min-h-48 items-center text-sm text-slate-600">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Loading application...
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
