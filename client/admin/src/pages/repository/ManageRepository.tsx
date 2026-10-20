import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  ArrowRight,
  BadgeCheck,
  LayoutGrid,
  Check,
  Database,
  FileText,
  LoaderCircle,
  Pencil,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import BackButton from "../../components/navigation/BackButton";
import Heading from "../../components/cards/Heading";
import Layout from "../../components/dashboard/Layout";
import {
  getRepositoryById,
  type RepositoryDetail,
  updateRepository,
} from "../../api/repository";

interface RepositoryForm {
  name: string;
  packageNames: string;
  uri: string;
  suite: string;
  component: string;
  fingerprint: string;
}

type RepositoryFormField = keyof RepositoryForm;

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
  packageName: "packageNames",
  uri: "uri",
  suite: "suite",
  component: "component",
  fingerprint: "fingerprint",
};

const emptyForm: RepositoryForm = {
  name: "",
  packageNames: "",
  uri: "",
  suite: "",
  component: "",
  fingerprint: "",
};

function parseRepositoryDetails(value: string): Partial<RepositoryForm> {
  const parsed: Partial<RepositoryForm> = {};
  const fields: Record<string, RepositoryFormField> = {
    name: "name",
    "package-name": "packageNames",
    package_name: "packageNames",
    "package-names": "packageNames",
    uris: "uri",
    uri: "uri",
    suites: "suite",
    suite: "suite",
    components: "component",
    component: "component",
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

function toRepositoryForm(data: RepositoryDetail): RepositoryForm {
  return {
    name: data.name,
    packageNames: data.packageName.join(", "),
    uri: data.uri,
    suite: data.suite,
    component: data.component,
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
        to: "/applications?applicationStatus=live",
        label: "Live",
        icon: BadgeCheck,
      },
    ],
  },
];

const fields: {
  key: RepositoryFormField;
  label: string;
  type?: string;
  wide?: boolean;
  hint?: string;
}[] = [
  { key: "name", label: "Repository name" },
  {
    key: "packageNames",
    label: "Package names",
    hint: "Separate multiple names with commas.",
  },
  { key: "uri", label: "Repository URL", type: "url", wide: true },
  { key: "suite", label: "Suite" },
  { key: "component", label: "Component" },
  { key: "fingerprint", label: "Fingerprint" },
];

const labelClassName =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500";
const inputClassName =
  "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";

export default function ManageRepository() {
  const { repositoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");
  const [repository, setRepository] = useState<RepositoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [repositoryDetails, setRepositoryDetails] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<RepositoryFormField, string>>
  >({});
  const [form, setForm] = useState(emptyForm);

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

  const updateField = (field: RepositoryFormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!repositoryId || !isEditing) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");
    setFieldErrors({});

    try {
      const result = await updateRepository(repositoryId, {
        name: form.name.trim(),
        packageName: form.packageNames
          .split(",")
          .map((packageName) => packageName.trim())
          .filter(Boolean),
        uri: form.uri.trim(),
        suite: form.suite.trim(),
        component: form.component.trim(),
        fingerprint: form.fingerprint.trim(),
      });
      setRepository(result.data);
      setForm(toRepositoryForm(result.data));
      setSaveSuccess(result.message);
      setIsEditing(false);
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
    navigate(`/repositories/${repositoryId}/edit`);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (repository) setForm(toRepositoryForm(repository));
    navigate(`/repositories/${repositoryId}`);
    setIsEditing(false);
    setSaveError("");
    setSaveSuccess("");
    setFieldErrors({});
    setRepositoryDetails("");
  };

  useEffect(() => {
    setIsEditing(isEditRoute);
  }, [isEditRoute]);

  const handleRepositoryDetailsChange = (value: string) => {
    setRepositoryDetails(value);
    setForm((current) => ({
      ...current,
      ...parseRepositoryDetails(value),
    }));
    setFieldErrors({});
    setSaveError("");
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
        <BackButton
          fallbackTo="/repositories"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          Back to repositories
        </BackButton>

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
          name={repository?.name ?? "Manage repository"}
          info="Manage repository"
          action={
            repository?.applicationId ? (
              <Link
                to={`/applications/${repository.applicationId}`}
                className="inline-flex h-10 items-center gap-2 border border-yellow-200 bg-yellow-50 px-3 text-sm font-medium text-yellow-700 hover:bg-yellow-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-700"
              >
                View application
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
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
            onSubmit={handleSave}
            className="mt-6 border border-slate-200 bg-white px-5 sm:px-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {isEditing ? "Edit repository" : "Repository details"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isEditing
                    ? "Update the source and package configuration."
                    : "Source location and package configuration"}
                </p>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={cancelEditing}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-70"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {isSaving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              ) : (
                repository && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex h-10 items-center gap-2 border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit repository
                  </button>
                )
              )}
            </div>

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

            {isEditing ? (
              <div className="grid gap-8 py-6 lg:grid-cols-2 lg:items-start">
                <div className="border border-slate-200 bg-white p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-950">
                    Edit repository
                  </h3>
                  <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    {fields.map(({ key, label, type, wide, hint }) => {
                      const errorId = `${key}-error`;
                      const cell = wide ? "sm:col-span-2" : "";

                      return (
                        <label key={key} className={`min-w-0 ${cell}`}>
                          <span className={labelClassName}>{label}</span>
                          <input
                            required
                            type={type}
                            value={form[key]}
                            onChange={(event) =>
                              updateField(key, event.target.value)
                            }
                            className={`${inputClassName} ${fieldErrors[key] ? "border-rose-500 focus:border-rose-600 focus:ring-rose-600/15" : ""}`}
                            aria-invalid={Boolean(fieldErrors[key])}
                            aria-describedby={
                              fieldErrors[key] ? errorId : undefined
                            }
                          />
                          {fieldErrors[key] && (
                            <span
                              id={errorId}
                              className="mt-1 block text-xs text-rose-700"
                            >
                              {fieldErrors[key]}
                            </span>
                          )}
                          {hint && !fieldErrors[key] && (
                            <span className="mt-1 block text-xs font-normal normal-case text-slate-500">
                              {hint}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-slate-200 bg-white p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-950">
                    Paste repository details
                  </h3>
                  <label className="mt-5 block text-sm font-medium text-slate-800">
                    APT metadata
                    <textarea
                      value={repositoryDetails}
                      onChange={(event) =>
                        handleRepositoryDetailsChange(event.target.value)
                      }
                      rows={10}
                      placeholder={`name: Brave Browser
package_name: brave-browser
URIs: https://brave-browser-apt-release.s3.brave.com
Suites: stable
Components: main
Fingerprint: ABCD 1234 EF56 7890`}
                      className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      Paste repository metadata to fill the fields automatically.
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid gap-x-6 gap-y-5 py-6 sm:grid-cols-2">
                {fields.map(({ key, label, wide }) => {
                  const cell = wide ? "sm:col-span-2" : "";
                  return (
                    <div
                      key={key}
                      className={`min-w-0 ${cell} border border-slate-200 bg-slate-50 p-2`}
                    >
                      <dt className={labelClassName}>{label}</dt>
                      <dd className="mt-2 flex min-h-11 items-start wrap-break-word text-sm font-medium text-slate-900">
                        {readValue(key) || "-"}
                      </dd>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Read-only metadata stays put in both modes */}
            <dl className="grid gap-x-6 gap-y-4 border-t border-slate-100 py-5 sm:grid-cols-2">
              {meta.map(({ label, value, exactValue }) => (
                <div key={label} className="min-w-0">
                  <dt className={labelClassName}>{label}</dt>
                  <dd
                    className="mt-1 text-sm text-slate-600"
                    title={exactValue}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </form>
        )}
      </section>
    </Layout>
  );
}
