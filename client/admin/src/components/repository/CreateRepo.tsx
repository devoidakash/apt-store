import { Check, LoaderCircle, X } from "lucide-react";
import { formatFingerprint } from "./repository-form";
import type {
  RepositoryForm,
  RepositoryFormField,
} from "./repository-form";

interface CreateRepoProps {
  form: RepositoryForm;
  fieldErrors: Partial<Record<RepositoryFormField, string>>;
  isSaving: boolean;
  saveError: string;
  buttonText: string;
  repositoryDetails: string;
  onCancel: () => void;
  onFieldChange: (field: RepositoryFormField, value: string) => void;
  onRepositoryDetailsChange: (value: string) => void;
}

const repositoryFields: {
  key: RepositoryFormField;
  label: string;
  type?: string;
  wide?: boolean;
  hint?: string;
  placeholder: string;
}[] = [
  {
    key: "name",
    label: "Application name",
    placeholder: "e.g. Mozilla Firefox",
  },
  {
    key: "packageName",
    label: "Package name",
    placeholder: "e.g. firefox-esr",
  },
  {
    key: "uri",
    label: "Repository URL",
    type: "url",
    wide: true,
    placeholder: "https://packages.example.com/debian",
  },
  { key: "suite", label: "Suite", placeholder: "e.g. stable" },
  { key: "component", label: "Component", placeholder: "main" },
  {
    key: "key_uri",
    label: "Key URL",
    type: "url",
    wide: true,
    placeholder: "https://packages.example.com/repository-key.gpg",
  },
  {
    key: "fingerprint",
    label: "Fingerprint",
    placeholder: "ABCD 1234 EF56 7890",
  },
];

const inputClassName =
  "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";

export default function CreateRepo({
  form,
  fieldErrors,
  isSaving,
  saveError,
  buttonText,
  repositoryDetails,
  onCancel,
  onFieldChange,
  onRepositoryDetailsChange,
}: CreateRepoProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Add repository
          </h2>
          {saveError && (
            <p role="alert" className="mt-1 text-sm text-rose-700">
              {saveError}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
            className="inline-flex h-10 items-center gap-2 border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-70"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-10 items-center gap-2 bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? "Saving..." : buttonText}
          </button>
        </div>
      </div>
      <div className="grid gap-8 py-6 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Repository details
          </h2>
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {repositoryFields.map(
              ({ key, label, type, wide, hint, placeholder }) => {
                const errorId = `${key}-error`;
                const cell = wide ? "sm:col-span-2" : "";

                return (
                  <label
                    key={key}
                    className={`text-sm font-medium text-slate-800 ${cell}`}
                  >
                    {label}
                    <input
                      required
                      type={type}
                      placeholder={placeholder}
                      value={
                        key === "fingerprint"
                          ? formatFingerprint(form[key])
                          : form[key]
                      }
                      onChange={(event) =>
                        onFieldChange(key, event.target.value)
                      }
                      className={`${inputClassName} ${fieldErrors[key] ? "border-rose-500 focus:border-rose-600 focus:ring-rose-600/15" : ""}`}
                      aria-invalid={Boolean(fieldErrors[key])}
                      aria-describedby={fieldErrors[key] ? errorId : undefined}
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
              },
            )}
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Paste repository details
          </h2>
          <label className="mt-5 block text-sm font-medium text-slate-800">
            APT metadata
            <textarea
              value={repositoryDetails}
              onChange={(event) =>
                onRepositoryDetailsChange(event.target.value)
              }
              rows={10}
              placeholder={`application_name: Example app
package_name: example_package
URIs: https://example_package-apt-release.s3.example.com
Suites: stable
Components: main
Key-URI: https://packages.example.com/repository-key.gpg
Fingerprint: ABCD 1234 EF56 7890`}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Paste repository metadata to fill the fields automatically.
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
