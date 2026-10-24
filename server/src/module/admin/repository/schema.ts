import z from "zod";

export type CreateRepositoryType = z.infer<typeof createRepository>;

export const repositoryId = z
  .string()
  .trim()
  .pipe(z.uuid({ error: "Invalid repository ID" }));

export const repositoryIdParams = z.object({
  repositoryId,
});

export const createRepository = z.object({
  displayName: z.string().trim(),
  packageName: z.string().trim().toLowerCase(),
  uri: z
    .string()
    .trim()
    .pipe(z.url({ protocol: /^https?$/ }))
    .refine((uri) => !uri.endsWith("/"), {
      error: "URIs must not end with a slash",
    }),
  suite: z.string().trim().toLowerCase(),
  component: z.string().trim().toLowerCase().optional(),
  key_uri: z
    .string()
    .trim()
    .pipe(z.url({ protocol: /^https?$/ }))
    .refine((uri) => !uri.endsWith("/"), {
      error: "Key url must not end with a slash",
    }),
  fingerprint: z
    .string()
    .trim()
    .transform((fingerprint) => fingerprint.replace(/\s+/g, "").toUpperCase()),
});
