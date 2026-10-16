import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  LayoutGrid,
  Database,
  FileText,
  Image,
  ImagePlus,
  LoaderCircle,
  Pencil,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router";
import Layout from "../../components/dashboard/Layout";
import {
  getApplicationById,
  type ApplicationStatus,
  type ApplicationDetail,
  updateApplication,
  updateApplicationStatus,
} from "../../api/application";

interface ApplicationForm {
  displayName: string;
  description: string;
  category: string;
  homepage: string;
}

interface ApiValidationError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: ApiValidationError[];
}

function toApplicationForm(application: ApplicationDetail): ApplicationForm {
  return {
    displayName: application.displayName ?? "",
    description: application.description ?? "",
    category: application.category ?? "",
    homepage: application.homepage ?? "",
  };
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ApplicationForm, string>>
  >({});
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationStatus>("draft");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");
  const [form, setForm] = useState<ApplicationForm>({
    displayName: "",
    description: "",
    category: "",
    homepage: "",
  });

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
          active:
            application === null ? undefined : application.status === "draft",
        },
        {
          to: "/applications?applicationStatus=live",
          label: "Live",
          icon: BadgeCheck,
          active:
            application === null ? undefined : application.status === "live",
        },
      ],
    },
  ];

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

        const result = await getApplicationById(
          applicationId,
          controller.signal,
        );
        setApplication(result);
        setForm(toApplicationForm(result));
        setApplicationStatus(result.status);
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

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!application) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");
    setFieldErrors({});

    try {
      const result = await updateApplication(application.id, {
        displayName: form.displayName.trim() || null,
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        homepage: form.homepage.trim() || null,
      });
      setApplication(result.data);
      setForm(toApplicationForm(result.data));
      setApplicationStatus(result.data.status);
      setSaveSuccess(result.message);
      setIsEditing(false);
    } catch (saveFailure) {
      if (axios.isAxiosError<ApiErrorResponse>(saveFailure)) {
        const errors: Partial<Record<keyof ApplicationForm, string>> = {};
        const formFields: (keyof ApplicationForm)[] = [
          "displayName",
          "description",
          "category",
          "homepage",
        ];

        for (const validationError of saveFailure.response?.data.errors ?? []) {
          const field = validationError.field.split(".").at(-1);
          if (
            field &&
            formFields.includes(field as keyof ApplicationForm) &&
            !errors[field as keyof ApplicationForm]
          ) {
            errors[field as keyof ApplicationForm] = validationError.message;
          }
        }

        setFieldErrors(errors);
        setSaveError(
          Object.keys(errors).length === 0
            ? (saveFailure.response?.data.message ?? saveFailure.message)
            : "",
        );
      } else {
        setSaveError(
          saveFailure instanceof Error
            ? saveFailure.message
            : "Could not update this application.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!application) return;

    setIsSavingStatus(true);
    setStatusError("");
    setStatusSuccess("");

    try {
      const result = await updateApplicationStatus(
        application.id,
        applicationStatus,
      );
      setApplication(result.data);
      setApplicationStatus(result.data.status);
      setStatusSuccess(result.message);
    } catch (saveFailure) {
      const message = axios.isAxiosError<{ message?: string }>(saveFailure)
        ? (saveFailure.response?.data?.message ?? saveFailure.message)
        : saveFailure instanceof Error
          ? saveFailure.message
          : "Could not update the application status.";
      setStatusError(message);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const cancelEditing = () => {
    if (application) setForm(toApplicationForm(application));
    setIsEditing(false);
    setSaveError("");
    setFieldErrors({});
  };

  const updateField = (field: keyof ApplicationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError("");
  };

  const getFieldErrorClassName = (field: keyof ApplicationForm) =>
    fieldErrors[field]
      ? "border-rose-500 focus:border-rose-600 focus:ring-rose-600/15"
      : "";

  const details = application
    ? [
        { label: "Display name", value: application.displayName },
        { label: "Package name", value: application.packageName },
        { label: "Description", value: application.description },
        {
          label: "Installed size",
          value: formatBytes(application.installedSizeBytes),
        },
        {
          label: "Download size",
          value: formatBytes(application.downloadSizeBytes),
        },
        { label: "Version", value: application.version },
        { label: "Maintainer", value: application.maintainer },
        { label: "Homepage", value: application.homepage },
        { label: "Category", value: application.category },
        { label: "Status", value: application.status },
        { label: "Repository ID", value: application.repositoryId },
        ...(application.images.length > 0
          ? [{ label: "Images", value: application.images.join(", ") }]
          : []),
        ...(application.missingSince
          ? [
              {
                label: "Missing since",
                value: formatDate(application.missingSince),
              },
            ]
          : []),
        { label: "Created", value: formatDate(application.createdAt) },
        { label: "Last updated", value: formatDate(application.updatedAt) },
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
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to applications
        </Link>

        <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-800"
              aria-label={
                application?.hasIcon ? "Application icon" : "Upload image"
              }
              title={application?.hasIcon ? "Application icon" : "Upload image"}
            >
              {application?.hasIcon ? (
                <Image className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Edit application
              </p>
              <h1 className="mt-1 wrap-break-word text-2xl font-semibold text-slate-950">
                {application?.displayName ||
                  application?.packageName ||
                  "Application"}
              </h1>
            </div>
          </div>
          {application && (
            <div className="flex flex-wrap items-center gap-3">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(toApplicationForm(application));
                    setSaveError("");
                    setSaveSuccess("");
                    setFieldErrors({});
                    setIsEditing(true);
                  }}
                  className="inline-flex h-10 items-center gap-2 border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit application
                </button>
              )}
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="mt-6 border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <LoaderCircle className="h-4 w-4 animate-spin text-emerald-700" />
              Loading application...
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse bg-slate-100" />
                  <div className="h-5 w-3/4 animate-pulse bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <p
            role="alert"
            className="mt-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {error}
          </p>
        ) : isEditing ? (
          <form
            onSubmit={handleSave}
            className="mt-6 border border-slate-200 bg-white px-5 sm:px-6"
          >
            <div className="border-b border-slate-200 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Edit application details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update package presentation and metadata.
              </p>
            </div>

            {saveError && (
              <p
                role="alert"
                className="mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {saveError}
              </p>
            )}

            <div className="grid gap-x-8 gap-y-5 py-6 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-800">
                Display name
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(event) =>
                    updateField("displayName", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.displayName)}
                  aria-describedby={
                    fieldErrors.displayName ? "display-name-error" : undefined
                  }
                  className={`mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 ${getFieldErrorClassName("displayName")}`}
                />
                {fieldErrors.displayName && (
                  <span
                    id="display-name-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.displayName}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-800">
                Homepage URL
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={form.homepage}
                  onChange={(event) =>
                    updateField("homepage", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.homepage)}
                  aria-describedby={
                    fieldErrors.homepage ? "homepage-error" : undefined
                  }
                  className={`mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 ${getFieldErrorClassName("homepage")}`}
                />
                {fieldErrors.homepage && (
                  <span
                    id="homepage-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.homepage}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-800 sm:col-span-2">
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={
                    fieldErrors.description ? "description-error" : undefined
                  }
                  className={`mt-2 w-full resize-y border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 ${getFieldErrorClassName("description")}`}
                />
                {fieldErrors.description && (
                  <span
                    id="description-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.description}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium text-slate-800 sm:col-span-2">
                Category
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.category)}
                  aria-describedby={
                    fieldErrors.category ? "category-error" : undefined
                  }
                  className={`mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 ${getFieldErrorClassName("category")}`}
                />
                {fieldErrors.category && (
                  <span
                    id="category-error"
                    className="mt-1 block text-xs text-rose-700"
                  >
                    {fieldErrors.category}
                  </span>
                )}
              </label>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-200 py-5">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-70"
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
                className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-70"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {saveSuccess && (
              <p
                aria-live="polite"
                className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                {saveSuccess}
              </p>
            )}
            <div className="mt-6 border border-slate-200 bg-white px-5 sm:px-6">
              <div className="border-b border-slate-200 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Application details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Package information and publishing metadata
                </p>
              </div>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {details.map(({ label, value }) => (
                  <div
                    key={label}
                    className={`min-w-0 border-b border-slate-100 py-4 ${
                      label === "Description" ? "sm:col-span-2" : ""
                    } ${label === "Repository ID" ? "sm:col-start-2" : ""}`}
                  >
                    <dt className="text-xs font-semibold uppercase text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-2 wrap-break-word text-sm font-medium text-slate-900">
                      {label === "Repository ID" && application ? (
                        <Link
                          to={`/repositories/${application.repositoryId}`}
                          className="text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        >
                          {value}
                        </Link>
                      ) : (
                        value || "-"
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
        {!isLoading && !error && application && (
          <form
            onSubmit={handleStatusSave}
            className="mt-6 border border-slate-200 bg-white px-5 sm:px-6"
          >
            <div className="border-b border-slate-200 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Application status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Change the publishing status independently.
              </p>
            </div>
            {statusError && (
              <p
                role="alert"
                className="mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {statusError}
              </p>
            )}
            {statusSuccess && (
              <p
                aria-live="polite"
                className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                {statusSuccess}
              </p>
            )}
            <div className="flex flex-wrap items-end gap-4 py-5">
              <label className="block w-full max-w-sm text-sm font-medium text-slate-800">
                Status
                <select
                  value={applicationStatus}
                  onChange={(event) => {
                    setApplicationStatus(
                      event.target.value as ApplicationStatus,
                    );
                    setStatusError("");
                    setStatusSuccess("");
                  }}
                  className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                >
                  <option value="draft">Draft</option>
                  <option value="live">Live</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={
                  isSavingStatus || applicationStatus === application.status
                }
                className="inline-flex h-11 items-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingStatus ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                {isSavingStatus ? "Updating..." : "Update status"}
              </button>
            </div>
          </form>
        )}
      </section>
    </Layout>
  );
}
