import { useState, type FormEvent } from "react";
import axios from "axios";
import { LoaderCircle, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { createRepository } from "../../api/repository";

interface RepositoryForm {
  displayName: string;
  packageName: string;
  uri: string;
  suite: string;
  component: string;
  key_uri: string;
  fingerprint: string;
}

const initialForm: RepositoryForm = {
  displayName: "",
  packageName: "",
  uri: "",
  suite: "",
  component: "",
  key_uri: "",
  fingerprint: "",
};

function parseRepositoryDetails(value: string): Partial<RepositoryForm> {
  const parsed: Partial<RepositoryForm> = {};
  const fields: Record<string, keyof RepositoryForm> = {
    name: "displayName",
    application_name: "displayName",
    "application-name": "displayName",
    "display-name": "displayName",
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

    const label = line.slice(0, separatorIndex).trim().toLowerCase();
    const field = fields[label];
    if (!field) return;

    const fieldValue = line.slice(separatorIndex + 1).trim();
    if (fieldValue) parsed[field] = fieldValue;
  });

  if (parsed.displayName && !parsed.packageName) {
    parsed.packageName = parsed.displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return parsed;
}

export default function ManageRepository() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [repositoryDetails, setRepositoryDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (field: keyof RepositoryForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleRepositoryDetailsChange = (value: string) => {
    setRepositoryDetails(value);
    const parsedDetails = parseRepositoryDetails(value);
    setForm((current) => ({ ...current, ...parsedDetails }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const result = await createRepository(form);
      navigate(`/repositories/${result.data.id}`);
    } catch (submitError) {
      const message = axios.isAxiosError<{ message?: string }>(submitError)
        ? (submitError.response?.data?.message ?? submitError.message)
        : submitError instanceof Error
          ? submitError.message
          : "Could not add this repository.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";

  return (
    <div className="w-full">
      <header className="border border-slate-200 bg-white px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Manage repositories
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Repository
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Connect an APT source and register a package from its index.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="w-full py-7">
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start">
          <div className="border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Add repository
            </h2>
            <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-800">
                Application name
                <input
                  required
                  name="displayName"
                  value={form.displayName}
                  onChange={(event) =>
                    updateField("displayName", event.target.value)
                  }
                  placeholder="e.g. Mozilla Firefox"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-800">
                Package name
                <input
                  required
                  name="packageName"
                  value={form.packageName}
                  onChange={(event) =>
                    updateField("packageName", event.target.value)
                  }
                  placeholder="e.g. firefox-esr"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-800 sm:col-span-2">
                Repository URL
                <input
                  required
                  type="url"
                  name="uri"
                  value={form.uri}
                  onChange={(event) => updateField("uri", event.target.value)}
                  placeholder="https://packages.example.com/debian"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-800">
                Suite
                <input
                  required
                  name="suite"
                  value={form.suite}
                  onChange={(event) => updateField("suite", event.target.value)}
                  placeholder="e.g. stable"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-800">
                Component
                <input
                  required
                  name="component"
                  value={form.component}
                  onChange={(event) =>
                    updateField("component", event.target.value)
                  }
                  placeholder="main"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-800">
                Key URI
                <input
                  required
                  type="url"
                  name="key_uri"
                  value={form.key_uri}
                  onChange={(event) =>
                    updateField("key_uri", event.target.value)
                  }
                  placeholder="https://packages.example.com/repository-key.gpg"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-800">
                Fingerprint
                <input
                  required
                  name="fingerprint"
                  value={form.fingerprint}
                  onChange={(event) =>
                    updateField("fingerprint", event.target.value)
                  }
                  placeholder="ABCD 1234 EF56 7890"
                  className={inputClassName}
                />
              </label>

              <div aria-live="polite" className="min-h-6 text-sm sm:col-span-2">
                {error && <p className="text-rose-700">{error}</p>}
                {success && <p className="text-emerald-700">{success}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70 sm:col-span-2 sm:justify-self-start"
              >
                {isSubmitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isSubmitting ? "Adding repository..." : "Add repository"}
              </button>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Paste repository details
            </h2>
            <label className="mt-5 block text-sm font-medium text-slate-800">
              APT metadata
              <textarea
                value={repositoryDetails}
                onChange={(event) =>
                  handleRepositoryDetailsChange(event.target.value)
                }
                rows={10}
                placeholder={`application_name: Brave Browser
package_name: brave-browser
URIs: https://brave-browser-apt-release.s3.brave.com
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
      </form>
    </div>
  );
}
