export interface RepositoryForm {
  name: string;
  packageName: string;
  uri: string;
  suite: string;
  component: string;
  key_uri: string;
  fingerprint: string;
}

export type RepositoryFormField = keyof RepositoryForm;

export function formatFingerprint(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatRepositoryErrorMessage(message: string) {
  return message.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g,
    (timestamp) => {
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime())
        ? timestamp
        : date.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          });
    },
  );
}
