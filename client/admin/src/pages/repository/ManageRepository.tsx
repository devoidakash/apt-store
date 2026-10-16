import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  Database,
  LoaderCircle,
  Pencil,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router";
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
  architecture: string;
  signedBy: string;
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
  architecture: "architecture",
  signedBy: "signedBy",
  signedby: "signedBy",
};

const emptyForm: RepositoryForm = {
  name: "",
  packageNames: "",
  uri: "",
  suite: "",
  component: "",
  architecture: "",
  signedBy: "",
};

function toRepositoryForm(data: RepositoryDetail): RepositoryForm {
  return {
    name: data.name,
    packageNames: data.packageName.join(", "),
    uri: data.uri,
    suite: data.suite,
    component: data.component,
    architecture: data.architecture,
    signedBy: data.signedby,
  };
}

const sidebarLinks = [
  {
    to: "/repositories",
    label: "Repositories",
    icon: Database,
    end: false,
  },
];

export default function ManageRepository() {
  const { repositoryId } = useParams();
  const [repository, setRepository] = useState<RepositoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
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

  const updateField = (field: keyof RepositoryForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!repositoryId) return;

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
        architecture: form.architecture.trim(),
        signedBy: form.signedBy.trim(),
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

  const cancelEditing = () => {
    if (repository) setForm(toRepositoryForm(repository));
    setIsEditing(false);
    setSaveError("");
    setSaveSuccess("");
    setFieldErrors({});
  };

  const inputClassName =
    "mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";
  const getInputClassName = (field: RepositoryFormField) =>
    `${inputClassName} ${fieldErrors[field] ? "border-rose-500 focus:border-rose-600 focus:ring-rose-600/15" : ""}`;

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

        <header className="border border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Package management
              </p>
              <h1 className="mt-2 wrap-break-word text-2xl font-semibold text-slate-950">
                {repository?.name ?? "Manage repository"}
              </h1>
            </div>
            {!isLoading && !error && repository && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setSaveSuccess("");
                  setIsEditing(true);
                }}
                className="inline-flex h-10 items-center gap-2 border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit repository
              </button>
            )}
          </div>
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
        ) : isEditing ? (
          <form onSubmit={handleSave} className="py-6">
            {saveError && (
              <p role="alert" className="mb-5 text-sm text-rose-700">
                {saveError}
              </p>
            )}
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-800">
                Repository name
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className={getInputClassName("name")}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                />
                {fieldErrors.name && (
                  <span
                    id="name-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.name}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-800">
                Package names
                <input
                  required
                  value={form.packageNames}
                  onChange={(event) =>
                    updateField("packageNames", event.target.value)
                  }
                  className={getInputClassName("packageNames")}
                  aria-invalid={Boolean(fieldErrors.packageNames)}
                  aria-describedby={`package-names-hint${fieldErrors.packageNames ? " package-names-error" : ""}`}
                />
                {fieldErrors.packageNames && (
                  <span
                    id="package-names-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.packageNames}
                  </span>
                )}
                <span
                  id="package-names-hint"
                  className="mt-1 block text-xs font-normal text-slate-500"
                >
                  Separate multiple names with commas.
                </span>
              </label>
              <label className="text-sm font-medium text-slate-800 sm:col-span-2">
                Repository URL
                <input
                  required
                  type="url"
                  value={form.uri}
                  onChange={(event) => updateField("uri", event.target.value)}
                  className={getInputClassName("uri")}
                  aria-invalid={Boolean(fieldErrors.uri)}
                  aria-describedby={fieldErrors.uri ? "uri-error" : undefined}
                />
                {fieldErrors.uri && (
                  <span
                    id="uri-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.uri}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-800">
                Suite
                <input
                  required
                  value={form.suite}
                  onChange={(event) => updateField("suite", event.target.value)}
                  className={getInputClassName("suite")}
                  aria-invalid={Boolean(fieldErrors.suite)}
                  aria-describedby={
                    fieldErrors.suite ? "suite-error" : undefined
                  }
                />
                {fieldErrors.suite && (
                  <span
                    id="suite-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.suite}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-800">
                Component
                <input
                  required
                  value={form.component}
                  onChange={(event) =>
                    updateField("component", event.target.value)
                  }
                  className={getInputClassName("component")}
                  aria-invalid={Boolean(fieldErrors.component)}
                  aria-describedby={
                    fieldErrors.component ? "component-error" : undefined
                  }
                />
                {fieldErrors.component && (
                  <span
                    id="component-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.component}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-800">
                Architecture
                <input
                  required
                  value={form.architecture}
                  onChange={(event) =>
                    updateField("architecture", event.target.value)
                  }
                  className={getInputClassName("architecture")}
                  aria-invalid={Boolean(fieldErrors.architecture)}
                  aria-describedby={
                    fieldErrors.architecture ? "architecture-error" : undefined
                  }
                />
                {fieldErrors.architecture && (
                  <span
                    id="architecture-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.architecture}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-800">
                Signing key
                <input
                  required
                  value={form.signedBy}
                  onChange={(event) =>
                    updateField("signedBy", event.target.value)
                  }
                  className={getInputClassName("signedBy")}
                  aria-invalid={Boolean(fieldErrors.signedBy)}
                  aria-describedby={
                    fieldErrors.signedBy ? "signed-by-error" : undefined
                  }
                />
                {fieldErrors.signedBy && (
                  <span
                    id="signed-by-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.signedBy}
                  </span>
                )}
              </label>
            </div>

            <div aria-live="polite" className="mt-5 min-h-6 text-sm">
              {saveSuccess && <p className="text-emerald-700">{saveSuccess}</p>}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
              >
                {isSaving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={cancelEditing}
                className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-70"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {saveSuccess && (
              <p aria-live="polite" className="py-4 text-sm text-emerald-700">
                {saveSuccess}
              </p>
            )}
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
          </>
        )}
      </section>
    </Layout>
  );
}
