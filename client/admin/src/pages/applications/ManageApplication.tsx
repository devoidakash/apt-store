import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import {
  BadgeCheck,
  Check,
  ExternalLink,
  LayoutGrid,
  Database,
  FileText,
  Image,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { useParams } from "react-router";
import Layout from "../../components/dashboard/Layout";
import {
  getApplicationById,
  getApplicationicon,
  type ApplicationStatus,
  type ApplicationDetail,
  updateApplication,
  updateApplicationStatus,
  updateApplicationIcon,
  updateApplicationImages,
} from "../../api/application";

interface ApplicationForm {
  displayName: string;
  caption: string;
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

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const validationMessages = error.response?.data?.errors?.map(
      (validationError) => validationError.message,
    );
    if (validationMessages?.length) return validationMessages.join(" ");
    return error.response?.data?.message ?? error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function toApplicationForm(application: ApplicationDetail): ApplicationForm {
  return {
    displayName: application.displayName ?? "",
    caption: application.caption ?? "",
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
  if (!Number.isFinite(bytes)) return "-";

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
  const [statusValidationErrors, setStatusValidationErrors] = useState<
    ApiValidationError[]
  >([]);
  const [statusSuccess, setStatusSuccess] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [iconUploadError, setIconUploadError] = useState("");
  const [iconUploadSuccess, setIconUploadSuccess] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const imagePreviewUrlsRef = useRef<string[]>([]);
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imagesUploadError, setImagesUploadError] = useState("");
  const [imagesUploadSuccess, setImagesUploadSuccess] = useState("");
  const [form, setForm] = useState<ApplicationForm>({
    displayName: "",
    caption: "",
    description: "",
    category: "",
    homepage: "",
  });

  useEffect(() => {
    return () => {
      imagePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const updateImagePreviews = (files: File[]) => {
    imagePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    imagePreviewUrlsRef.current = previewUrls;
    setImagePreviewUrls(previewUrls);
  };

  const removeImageFile = (index: number) => {
    const files = imageFiles.filter((_, fileIndex) => fileIndex !== index);
    setImageFiles(files);
    updateImagePreviews(files);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    setImagesUploadError("");
    setImagesUploadSuccess("");
  };

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
        caption: form.caption.trim() || null,
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        homepage: form.homepage.trim() || null,
      });
      const updatedApplication = await getApplicationById(application.id);
      setApplication(updatedApplication);
      setForm(toApplicationForm(updatedApplication));
      setApplicationStatus(updatedApplication.status);
      setSaveSuccess(result.message);
      setIsEditing(false);
    } catch (saveFailure) {
      if (axios.isAxiosError<ApiErrorResponse>(saveFailure)) {
        const errors: Partial<Record<keyof ApplicationForm, string>> = {};
        const formFields: (keyof ApplicationForm)[] = [
          "displayName",
          "caption",
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
    setStatusValidationErrors([]);
    setStatusSuccess("");

    try {
      const result = await updateApplicationStatus(
        application.id,
        applicationStatus,
      );
      const updatedApplication = await getApplicationById(application.id);
      setApplication(updatedApplication);
      setApplicationStatus(updatedApplication.status);
      setStatusSuccess(result.message);
    } catch (saveFailure) {
      if (axios.isAxiosError<ApiErrorResponse>(saveFailure)) {
        const errors = saveFailure.response?.data?.errors ?? [];
        setStatusValidationErrors(errors);
        setStatusError(
          errors.length === 0
            ? (saveFailure.response?.data?.message ?? saveFailure.message)
            : "",
        );
      } else {
        setStatusError(
          saveFailure instanceof Error
            ? saveFailure.message
            : "Could not update the application status.",
        );
      }
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleIconUpload = async () => {
    if (!application || !iconFile) return;

    setIsUploadingIcon(true);
    setIconUploadError("");
    setIconUploadSuccess("");

    try {
      const result = await updateApplicationIcon(application.id, iconFile);
      setApplication(await getApplicationById(application.id));
      setIconFile(null);
      if (iconFileInputRef.current) iconFileInputRef.current.value = "";
      setIconUploadSuccess(result.message);
    } catch (uploadFailure) {
      setIconUploadError(
        getApiErrorMessage(
          uploadFailure,
          "Could not update the application icon.",
        ),
      );
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleImagesUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!application) return;
    if (imageFiles.length !== 5) {
      setImagesUploadError("Select exactly 5 images.");
      return;
    }

    const uploadForm = event.currentTarget;
    setIsUploadingImages(true);
    setImagesUploadError("");
    setImagesUploadSuccess("");

    try {
      const result = await updateApplicationImages(application.id, imageFiles);
      setApplication(await getApplicationById(application.id));
      setImageFiles([]);
      updateImagePreviews([]);
      uploadForm.reset();
      setImagesUploadSuccess(result.message);
    } catch (uploadFailure) {
      setImagesUploadError(
        getApiErrorMessage(
          uploadFailure,
          "Could not update application images.",
        ),
      );
    } finally {
      setIsUploadingImages(false);
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

  return (
    <Layout
      sidebarLinks={sidebarLinks}
      searchPlaceholder="Search applications..."
    >
      <section className="w-full">
        {/* <Link
          to={`/applications?applicationStatus=${application?.status ?? "draft"}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to applications
        </Link> */}

        {/* <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-800"
              aria-label={
                application?.icon ? "Application icon" : "Upload image"
              }
              title={application?.icon ? "Application icon" : "Upload image"}
            >
              {application?.icon ? (
                <img
                  src={getApplicationicon(application.icon)}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              ) : application?.iconUpdatedAt ? (
                <Image className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Manage application
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
                <Link
                  to={`/repositories/${application.repositoryId}`}
                  className="inline-flex h-10 items-center gap-2 border border-orange-200 bg-orange-50 px-3 text-sm font-medium text-orange-700 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
                >
                  View repository
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}
        </header> */}

        {isLoading ? (
          <div className=" border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <LoaderCircle className="h-4 w-4 animate-spin text-emerald-700" />
              Loading application...
            </div>
            <div className=" grid gap-5 sm:grid-cols-2">
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
            className=" border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {error}
          </p>
        ) : isEditing ? (
          <form
            onSubmit={handleSave}
            className=" overflow-hidden border border-slate-200 bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 px-5 py-5 sm:px-8">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-1.5">
                  {application?.icon ? (
                    <img
                      src={getApplicationicon(application.icon)}
                      alt=""
                      className="h-full w-full rounded-lg object-contain"
                    />
                  ) : (
                    <ImagePlus
                      className="h-6 w-6 text-emerald-700"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    Manage application
                  </p>
                  <h2 className="mt-1 wrap-break-word text-xl font-semibold text-slate-950">
                    {application?.displayName ||
                      application?.packageName ||
                      "Application"}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={cancelEditing}
                  className="inline-flex h-10 items-center gap-2 border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:opacity-70"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              </div>
            </div>

            {saveError && (
              <p
                role="alert"
                className="mx-5 mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-8"
              >
                {saveError}
              </p>
            )}

            <div className="grid gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(220px,0.65fr)_minmax(0,1.35fr)]">
              <div className="border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 border-b border-slate-200 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Application icon
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Update the application icon.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingIcon}
                        onClick={() => {
                          if (iconFile) {
                            void handleIconUpload();
                          } else {
                            iconFileInputRef.current?.click();
                          }
                        }}
                        className="inline-flex h-10 items-center gap-2 bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploadingIcon ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : iconFile ? (
                          <Image className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        )}
                        {isUploadingIcon
                          ? "Uploading..."
                          : iconFile
                            ? "Upload icon"
                            : "Select icon"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex h-56 items-center justify-center border border-slate-200 bg-white">
                  {application?.icon ? (
                    <img
                      src={getApplicationicon(application.icon)}
                      alt={`${application.displayName || application.packageName} icon preview`}
                      className="h-40 w-40 object-contain"
                    />
                  ) : (
                    <ImagePlus
                      className="h-10 w-10 text-emerald-700"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <input
                  id="application-icon-input"
                  ref={iconFileInputRef}
                  type="file"
                  accept="image/webp,.webp"
                  onChange={(event) => {
                    setIconFile(event.target.files?.[0] ?? null);
                    setIconUploadError("");
                    setIconUploadSuccess("");
                  }}
                  className="sr-only"
                />
                {iconFile && (
                  <p className="mt-2 truncate text-xs text-slate-500">
                    {iconFile.name}
                  </p>
                )}
                {iconUploadError && (
                  <p role="alert" className="mt-2 text-sm text-rose-700">
                    {iconUploadError}
                  </p>
                )}
                {iconUploadSuccess && (
                  <p
                    aria-live="polite"
                    className="mt-2 text-sm text-emerald-700"
                  >
                    {iconUploadSuccess}
                  </p>
                )}
              </div>

              <div className="border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 border-b border-slate-200 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Basic information
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Update the application details shown to users.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex h-10 items-center gap-2 bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-70"
                    >
                      {isSaving ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      )}
                      {isSaving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-800">
                    Display name
                    <input
                      type="text"
                      minLength={2}
                      maxLength={20}
                      value={form.displayName}
                      onChange={(event) =>
                        updateField("displayName", event.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.displayName)}
                      aria-describedby={
                        fieldErrors.displayName
                          ? "display-name-error"
                          : undefined
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
                    Caption
                    <input
                      type="text"
                      minLength={5}
                      maxLength={50}
                      value={form.caption}
                      onChange={(event) =>
                        updateField("caption", event.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.caption)}
                      aria-describedby={
                        fieldErrors.caption ? "caption-error" : undefined
                      }
                      className={`mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 ${getFieldErrorClassName("caption")}`}
                    />
                    {fieldErrors.caption && (
                      <span
                        id="caption-error"
                        className="mt-1 block text-xs text-rose-700"
                      >
                        {fieldErrors.caption}
                      </span>
                    )}
                  </label>
                  <label className="text-sm font-medium text-slate-800">
                    Category
                    <input
                      type="text"
                      minLength={2}
                      maxLength={10}
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
                      minLength={10}
                      maxLength={500}
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.description)}
                      aria-describedby={
                        fieldErrors.description
                          ? "description-error"
                          : undefined
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
                </div>
              </div>
            </div>
          </form>
        ) : (
          <>
            {saveSuccess && (
              <p
                aria-live="polite"
                className=" border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                {saveSuccess}
              </p>
            )}
            {application && (
              <article className="overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-sm">
                <div className="px-6 pb-7 pt-7 sm:px-10 sm:pt-10">
                  <div className="flex flex-wrap items-start justify-between gap-8">
                    <div className="flex min-w-0 items-start gap-5">
                      <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-2 shadow-sm sm:h-28 sm:w-28">
                        {application.icon ? (
                          <img
                            src={getApplicationicon(application.icon)}
                            alt=""
                            className="h-full w-full rounded-xl object-contain"
                          />
                        ) : (
                          <ImagePlus
                            className="h-8 w-8 text-emerald-700"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <div className="min-w-0 pt-3">
                        <h2 className="mt-1 wrap-break-word text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                          {application.displayName || application.packageName}
                        </h2>
                        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <ShieldCheck
                            className="h-4 w-4 text-emerald-600"
                            aria-hidden="true"
                          />
                          <span>
                            {application.maintainer || "Unknown publisher"}
                          </span>
                          <span className="text-emerald-600">&#9679;</span>
                          <span>{application.category || "Utilities"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setForm(toApplicationForm(application));
                          setSaveError("");
                          setSaveSuccess("");
                          setFieldErrors({});
                          setIsEditing(true);
                        }}
                        className="inline-flex h-11 items-center gap-2 bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Manage application
                      </button>
                      {application.homepage && (
                        <a
                          href={application.homepage}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open application website"
                          className="inline-flex h-11 w-11 items-center justify-center border border-slate-300 text-slate-600 transition hover:border-slate-500 hover:text-slate-900"
                        >
                          <ExternalLink
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <dl className="grid border-y border-slate-200 bg-slate-50 sm:grid-cols-4">
                  {[
                    [
                      "Download size",
                      formatBytes(application.downloadSizeBytes),
                    ],
                    [
                      "Installed size",
                      formatBytes(application.installedSizeBytes),
                    ],
                    ["Version", application.version],
                    ["Last updated", formatDate(application.updatedAt)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border-slate-200 px-6 py-5 sm:border-r sm:px-8 last:border-r-0"
                    >
                      <dt className="text-xs font-medium text-slate-500">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="space-y-10 px-6 py-7 sm:px-10 sm:py-9">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      About this application
                    </h3>
                    <p className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-7 text-slate-600">
                      {application.description || "No description available."}
                    </p>
                    {application.missingSince && (
                      <p className="mt-5 text-xs text-amber-300">
                        Missing since {formatDate(application.missingSince)}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Images
                      </h3>
                      <span className="text-xs text-slate-500">
                        {application.images.length} images
                      </span>
                    </div>
                    {application.images.length > 0 ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {application.images.map((image, index) => (
                          <img
                            key={image}
                            src={image}
                            alt={`${application.displayName || application.packageName} screenshot ${index + 1}`}
                            className="aspect-video w-full rounded-md border border-slate-200 object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 flex aspect-video items-center justify-center border border-dashed border-slate-300 text-sm text-slate-500">
                        No screenshots uploaded
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )}
          </>
        )}
        {!isLoading && !error && application && isEditing && (
          <section className="mt-6 border border-slate-200 bg-white px-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Application media
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the icon and screenshots independently.
                </p>
              </div>
              <button
                type="submit"
                form="application-images-form"
                disabled={isUploadingImages}
                className="inline-flex h-10 items-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50"
              >
                {isUploadingImages ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                )}
                {isUploadingImages ? "Uploading..." : "Upload images"}
              </button>
            </div>
            <div>
              <form
                id="application-images-form"
                onSubmit={handleImagesUpload}
                className="space-y-4 py-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Images
                  </h3>
                  <span className="text-xs font-medium text-slate-600">
                    {application.images.length}/5 uploaded
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(imagePreviewUrls.length > 0
                    ? imagePreviewUrls
                    : application.images
                  ).map((image, index) => (
                    <div key={`${image}-${index}`} className="relative">
                      <img
                        src={image}
                        alt={`${application.displayName || application.packageName} screenshot ${index + 1}`}
                        className="aspect-video w-full border border-slate-200 object-cover"
                      />
                      {imagePreviewUrls.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeImageFile(index)}
                          aria-label={`Remove selected image ${index + 1}`}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center bg-rose-600 text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                  <label
                    htmlFor="application-images-input"
                    title="Browse for screenshots"
                    className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-700"
                  >
                    <Plus className="h-7 w-7" aria-hidden="true" />
                    <span className="text-xs font-medium">Add images</span>
                    <span className="sr-only">Choose exactly 5 images</span>
                  </label>
                  <input
                    id="application-images-input"
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      setImageFiles(files);
                      updateImagePreviews(files);
                      setImagesUploadError("");
                      setImagesUploadSuccess("");
                    }}
                    className="sr-only"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {imageFiles.length} selected. JPEG and PNG, up to 5 MB each.
                </p>
                {imagesUploadError && (
                  <p role="alert" className="text-sm text-rose-700">
                    {imagesUploadError}
                  </p>
                )}
                {imagesUploadSuccess && (
                  <p aria-live="polite" className="text-sm text-emerald-700">
                    {imagesUploadSuccess}
                  </p>
                )}
              </form>
            </div>
          </section>
        )}
        {!isLoading && !error && application && isEditing && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={handleStatusSave}
              className="flex h-full flex-col border border-slate-200 bg-white px-5 sm:px-6 lg:col-span-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Application status
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Change the publishing status independently.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={
                    isSavingStatus || applicationStatus === application.status
                  }
                  className="inline-flex h-10 items-center gap-2 bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingStatus ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isSavingStatus ? "Updating..." : "Update status"}
                </button>
              </div>
              {statusError && (
                <p
                  role="alert"
                  className="mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  {statusError}
                </p>
              )}
              {statusValidationErrors.length > 0 && (
                <ul
                  role="alert"
                  className="mt-5 list-disc border border-rose-200 bg-rose-50 px-9 py-3 text-sm text-rose-800"
                >
                  {statusValidationErrors.map((validationError, index) => (
                    <li key={`${validationError.field}-${index}`}>
                      {validationError.message}
                    </li>
                  ))}
                </ul>
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
                      setStatusValidationErrors([]);
                      setStatusSuccess("");
                    }}
                    className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  >
                    <option value="draft">Draft</option>
                    <option value="live">Live</option>
                  </select>
                </label>
              </div>
            </form>
          </div>
        )}
      </section>
    </Layout>
  );
}
