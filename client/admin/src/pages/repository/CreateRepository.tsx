import { useState, type FormEvent } from "react";
import axios from "axios";
import { Database } from "lucide-react";
import { useNavigate } from "react-router";
import { createRepository } from "../../api/repository";
import Heading from "../../components/cards/Heading";
import CreateRepo from "../../components/repository/CreateRepo";
import type {
  RepositoryForm,
  RepositoryFormField,
} from "../../components/repository/repository-form";

interface ApiValidationError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: ApiValidationError[];
}

const apiFieldToFormField: Record<string, RepositoryFormField> = {
  name: "name",
  displayName: "name",
  display_name: "name",
  application_name: "name",
  "application-name": "name",
  packageName: "packageName",
  package_name: "packageName",
  "package-name": "packageName",
  uri: "uri",
  uris: "uri",
  suite: "suite",
  suites: "suite",
  component: "component",
  components: "component",
  key_uri: "key_uri",
  "key-uri": "key_uri",
  fingerprint: "fingerprint",
};

const initialForm: RepositoryForm = {
  name: "",
  packageName: "",
  uri: "",
  suite: "",
  component: "",
  key_uri: "",
  fingerprint: "",
};

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

    const label = line.slice(0, separatorIndex).trim().toLowerCase();
    const field = fields[label];
    if (!field) return;

    const fieldValue = line.slice(separatorIndex + 1).trim();
    if (fieldValue) parsed[field] = fieldValue;
  });

  if (parsed.name && !parsed.packageName) {
    parsed.packageName = parsed.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return parsed;
}

export default function CreateRepository() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [repositoryDetails, setRepositoryDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<RepositoryFormField, string>>
  >({});

  const updateField = (field: RepositoryFormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  };

  const handleRepositoryDetailsChange = (value: string) => {
    setRepositoryDetails(value);
    setForm((current) => ({
      ...current,
      ...parseRepositoryDetails(value),
    }));
    setFieldErrors({});
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await createRepository({
        displayName: form.name,
        packageName: form.packageName,
        uri: form.uri,
        suite: form.suite,
        component: form.component,
        key_uri: form.key_uri,
        fingerprint: form.fingerprint,
      });
      navigate(`/repositories/${result.data.id}`);
    } catch (submitError) {
      if (axios.isAxiosError<ApiErrorResponse>(submitError)) {
        const errors: Partial<Record<RepositoryFormField, string>> = {};
        for (const validationError of submitError.response?.data.errors ?? []) {
          const apiField = validationError.field.split(".")[0];
          const formField = apiFieldToFormField[apiField];
          if (formField && !errors[formField]) {
            errors[formField] = validationError.message;
          }
        }
        setFieldErrors(errors);
        setError(
          submitError.response?.data?.message ?? submitError.message,
        );
      } else {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Could not add this repository.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full">
      <Heading
        icon={
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-800"
            aria-label="Repository"
          >
            <Database
              className="h-6 w-6 text-emerald-700"
              aria-hidden="true"
            />
          </span>
        }
        name="Add Repository"
        info="Create repository"
      />
      <form
        id="repository-form"
        onSubmit={handleSubmit}
        className="mt-6 border border-slate-200 bg-white px-5 sm:px-6"
      >
        <CreateRepo
          form={form}
          fieldErrors={fieldErrors}
          isSaving={isSubmitting}
          saveError={error}
          buttonText="Create"
          repositoryDetails={repositoryDetails}
          onCancel={() => navigate("/repositories")}
          onFieldChange={updateField}
          onRepositoryDetailsChange={handleRepositoryDetailsChange}
        />
      </form>
    </section>
  );
}
