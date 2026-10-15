import { useState, type FormEvent } from "react";
import axios from "axios";
import { LoaderCircle, Plus } from "lucide-react";
import { createRepository } from "../api/repository";

interface RepositoryForm {
  package_name: string;
  uri: string;
  suite: string;
  component: string;
  architecture: string;
  signedBy: string;
}

const initialForm: RepositoryForm = {
  package_name: "",
  uri: "",
  suite: "",
  component: "main",
  architecture: "amd64",
  signedBy: "",
};

export default function Repository() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (field: keyof RepositoryForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const result = await createRepository(form);
      setSuccess(result.message);
      setForm(initialForm);
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
    <div className="mx-auto max-w-5xl">
      <header className="border border-slate-200 bg-white px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Package management
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Repository
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Connect an APT source and register a package from its index.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl py-7">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-800 sm:col-span-2">
            Package name
            <input
              required
              name="package_name"
              value={form.package_name}
              onChange={(event) =>
                updateField("package_name", event.target.value)
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
              onChange={(event) => updateField("component", event.target.value)}
              placeholder="main"
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-medium text-slate-800">
            Architecture
            <select
              required
              name="architecture"
              value={form.architecture}
              onChange={(event) =>
                updateField("architecture", event.target.value)
              }
              className={inputClassName}
            >
              <option value="amd64">amd64</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-800">
            Signing key
            <input
              required
              name="signedBy"
              value={form.signedBy}
              onChange={(event) => updateField("signedBy", event.target.value)}
              placeholder="Key fingerprint or key data"
              className={inputClassName}
            />
          </label>
        </div>

        <div aria-live="polite" className="mt-5 min-h-6 text-sm">
          {error && <p className="text-rose-700">{error}</p>}
          {success && <p className="text-emerald-700">{success}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isSubmitting ? "Adding repository..." : "Add repository"}
        </button>
      </form>
    </div>
  );
}
