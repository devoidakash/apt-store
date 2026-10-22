import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  ArrowRight,
  BadgeCheck,
  LayoutGrid,
  Database,
  FileText,
  Copy,
  LoaderCircle,
  Pencil,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Heading from "../../components/cards/Heading";
import Layout from "../../components/dashboard/Layout";
import CreateRepo from "../../components/repository/CreateRepo";
import {
  formatFingerprint,
  type RepositoryForm,
  type RepositoryFormField,
} from "../../components/repository/repository-form";
import {
  getRepositoryById,
  type RepositoryDetail,
  updateRepository,
} from "../../api/repository";

interface ValidationError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: ValidationError[];
}

const apiFieldToFormField: Record<string, RepositoryFormField> = {
  name: "name",
  displayName: "name",
  packageName: "packageName",
  uri: "uri",
  suite: "suite",
  component: "component",
  key_uri: "key_uri",
  fingerprint: "fingerprint",
};

const emptyForm: RepositoryForm = {
  name: "",
  packageName: "",
  uri: "",
  suite: "",
  component: "",
  key_uri: "",
  fingerprint: "",
};

const viewFields: {
  key: RepositoryFormField;
  label: string;
  wide?: boolean;
}[] = [
  { key: "name", label: "Application name" },
  { key: "packageName", label: "Package name" },
  { key: "uri", label: "Repository URL", wide: true },
  { key: "suite", label: "Suite" },
  { key: "component", label: "Component" },
  { key: "key_uri", label: "Key URL", wide: true },
  { key: "fingerprint", label: "Fingerprint" },
];

function parseRepositoryDetails(value: string): Partial<RepositoryForm> {
  const parsed: Partial<RepositoryForm> = {};
  const fields: Record<string, RepositoryFormField> = {
    name: "name",
    application_name: "name",
    "application-name": "name",
    "display-name": "name",
    "package-name": "packageName",
    package_name: "packageName",
    uris: "uri",
    uri: "uri",
    suites: "suite",
    suite: "suite",
    components: "component",
    component: "component",
    "key-uri": "key_uri",
    key_uri: "key_uri",
    fingerprint: "fingerprint",
  };

  value.split(/\r?\n/).forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;

    const field = fields[line.slice(0, separatorIndex).trim().toLowerCase()];
    const fieldValue = line.slice(separatorIndex + 1).trim();
    if (field && fieldValue) parsed[field] = fieldValue;
  });

  return parsed;
}

function formatRepositoryDetails(form: RepositoryForm) {
  return `application_name: ${form.name}
package_name: ${form.packageName}
URIs: ${form.uri}
Suites: ${form.suite}
Components: ${form.component}
Key-URI: ${form.key_uri}
Fingerprint: ${formatFingerprint(form.fingerprint)}`;
}

function toRepositoryForm(data: RepositoryDetail): RepositoryForm {
  return {
    name: data.displayName,
    packageName: data.packageName,
    uri: data.uri,
    suite: data.suite,
    component: data.component,
    key_uri: data.keyUri,
    fingerprint: data.fingerprint,
  };
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "-";

  const elapsedSeconds = Math.round((Date.now() - timestamp) / 1000);
  const units = [
    { limit: 60, divisor: 1, label: "second" },
    { limit: 3600, divisor: 60, label: "minute" },
    { limit: 86400, divisor: 3600, label: "hour" },
    { limit: 604800, divisor: 86400, label: "day" },
    { limit: 2592000, divisor: 604800, label: "week" },
    { limit: 31536000, divisor: 2592000, label: "month" },
    { limit: Infinity, divisor: 31536000, label: "year" },
  ];
  const unit = units.find(({ limit }) => Math.abs(elapsedSeconds) < limit);
  if (!unit) return "-";

  const amount = Math.round(elapsedSeconds / unit.divisor);
  if (amount === 0) return "just now";

  return `${Math.abs(amount)} ${unit.label}${Math.abs(amount) === 1 ? "" : "s"} ${amount < 0 ? "from now" : "ago"}`;
}

function formatExactTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

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

export default function ManageRepository() {
  const { repositoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");
  const [repository, setRepository] = useState<RepositoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [repositoryDetails, setRepositoryDetails] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<RepositoryFormField, string>>
  >({});
  const [form, setForm] = useState(emptyForm);
  const [copyStatus, setCopyStatus] = useState("");

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
        setForm(toRepositoryForm(result));
        if (isEditRoute)
          setRepositoryDetails(
            formatRepositoryDetails(toRepositoryForm(result)),
          );
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
  }, [isEditRoute, repositoryId]);

  const updateField = (field: RepositoryFormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!repositoryId || !isEditRoute) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");
    setFieldErrors({});

    try {
      const result = await updateRepository(repositoryId, {
        displayName: form.name.trim(),
        packageName: form.packageName.trim(),
        uri: form.uri.trim(),
        suite: form.suite.trim(),
        component: form.component.trim(),
        key_uri: form.key_uri.trim(),
        fingerprint: form.fingerprint.trim(),
      });
      setRepository(result.data);
      setForm(toRepositoryForm(result.data));
      setSaveSuccess(result.message);
    } catch (saveFailure) {
      if (axios.isAxiosError<ApiErrorResponse>(saveFailure)) {
        const errors: Partial<Record<RepositoryFormField, string>> = {};
        for (const validationError of saveFailure.response?.data.errors ?? []) {
          const apiField = validationError.field.split(".")[0];
          const formField = apiFieldToFormField[apiField];
          if (formField && !errors[formField]) {
            errors[formField] = validationError.message;
          }
        }
        setFieldErrors(errors);
        setSaveError(saveFailure.response?.data.message ?? saveFailure.message);
      } else {
        setSaveError(
          saveFailure instanceof Error
            ? saveFailure.message
            : "Could not update this repository.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    setSaveSuccess("");
    setRepositoryDetails(formatRepositoryDetails(form));
    navigate(`/repositories/${repositoryId}/edit`);
  };

  const cancelEditing = () => {
    if (repository) setForm(toRepositoryForm(repository));
    navigate(`/repositories/${repositoryId}`);
    setSaveError("");
    setSaveSuccess("");
    setFieldErrors({});
    setRepositoryDetails("");
  };

  const handleRepositoryDetailsChange = (value: string) => {
    setRepositoryDetails(value);
    setForm((current) => ({
      ...current,
      ...parseRepositoryDetails(value),
    }));
    setFieldErrors({});
    setSaveError("");
  };

  const copyKeyContent = async () => {
    if (!repository?.keyContent) return;

    try {
      await navigator.clipboard.writeText(repository.keyContent);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed");
    }
    window.setTimeout(() => setCopyStatus(""), 2000);
  };

  const readValue = (key: RepositoryFormField) =>
    repository ? toRepositoryForm(repository)[key] : "";

  const meta = repository
    ? [
        {
          label: "Created",
          value: formatExactTime(repository.createdAt),
          exactValue: formatExactTime(repository.createdAt),
        },
        {
          label: "Last updated",
          value: formatRelativeTime(repository.updatedAt),
          exactValue: formatExactTime(repository.updatedAt),
        },
      ]
    : [];

  return (
    <Layout
      sidebarLinks={sidebarLinks}
      searchPlaceholder="Search repositories..."
    >
      <section className="w-full">
        <Heading
          icon={
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-800"
              aria-label={repository?.icon ? "Repository icon" : "Repository"}
            >
              {repository?.icon ? (
                <img
                  src={repository.icon}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Database
                  className="h-6 w-6 text-emerald-700"
                  aria-hidden="true"
                />
              )}
            </span>
          }
          name={repository?.displayName ?? "Manage repository"}
          info={isEditRoute ? "Edit repository" : "Manage repository"}
          action={
            !isLoading && !error ? (
              <div className="flex flex-wrap gap-2">
                {repository?.applicationId && (
                  <Link
                    to={`/applications/${repository.applicationId}`}
                    className="inline-flex h-10 items-center gap-2 border border-yellow-200 bg-yellow-50 px-3 text-sm font-medium text-yellow-700 hover:bg-yellow-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-700"
                  >
                    View application
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            ) : null
          }
        />

        {isLoading ? (
          <div className="mt-6 border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <LoaderCircle className="h-4 w-4 animate-spin text-emerald-700" />
              Loading repository...
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse bg-slate-100" />
                  <div className="h-5 w-3/4 animate-pulse bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {error}
          </div>
        ) : (
          /* One card, one grid: view and edit render in the same place. */
          <form
            id="repository-form"
            onSubmit={handleSave}
            className="mt-6 border border-slate-200 bg-white px-5 sm:px-6"
          >
            {!isEditRoute && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Repository details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Source location and package configuration
                  </p>
                </div>
                {repository && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex h-10 items-center gap-2 border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit repository
                  </button>
                )}
              </div>
            )}

            <div aria-live="polite">
              {saveSuccess && (
                <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {saveSuccess}
                </p>
              )}
              {saveError && (
                <p
                  role="alert"
                  className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  {saveError}
                </p>
              )}
            </div>

            {isEditRoute ? (
              <CreateRepo
                form={form}
                fieldErrors={fieldErrors}
                isSaving={isSaving}
                saveError={saveError}
                repositoryDetails={repositoryDetails}
                onCancel={cancelEditing}
                onFieldChange={updateField}
                onRepositoryDetailsChange={handleRepositoryDetailsChange}
              />
            ) : (
              <div className="grid gap-x-6 gap-y-5 py-6 sm:grid-cols-2">
                {viewFields.map(({ key, label, wide }) => {
                  const cell = wide ? "sm:col-span-2" : "";
                  const value = readValue(key);
                  return (
                    <div
                      key={key}
                      className={`min-w-0 ${cell} border border-slate-200 bg-slate-50 p-2`}
                    >
                      <dt className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </dt>
                      <dd className="mt-2 flex min-h-11 items-start wrap-break-word text-sm font-medium text-slate-900">
                        {key === "fingerprint"
                          ? formatFingerprint(value) || "-"
                          : value || "-"}
                      </dd>
                    </div>
                  );
                })}
                <div className="min-w-0 border border-slate-200 bg-slate-50 p-2">
                  <dt className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Key content
                  </dt>
                  <dd className="mt-2 flex min-h-11 items-center justify-between gap-3 text-sm font-medium text-slate-900">
                    <code className="min-w-0 truncate">
                      {repository?.keyContent
                        ? `${repository.keyContent.slice(0, 48)}...`
                        : "-"}
                    </code>
                    {repository?.keyContent && (
                      <button
                        type="button"
                        onClick={() => void copyKeyContent()}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        {copyStatus || "Copy"}
                      </button>
                    )}
                  </dd>
                </div>
              </div>
            )}

            {!isEditRoute && (
              <dl className="grid gap-x-6 gap-y-4 border-t border-slate-100 py-5 sm:grid-cols-2">
                {meta.map(({ label, value, exactValue }) => (
                  <div key={label} className="min-w-0">
                    <dt className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </dt>
                    <dd
                      className="mt-1 text-sm text-slate-600"
                      title={exactValue}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </form>
        )}
      </section>
    </Layout>
  );
}
