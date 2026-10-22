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
