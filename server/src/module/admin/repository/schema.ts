import z from "zod";

export const repositoryId = z.object({
  repositoryId: z.string().trim().uuid({ message: "Invalid repository ID" }),
});

export const createRepository = z.object({
  name: z.string().trim(),
  packageName: z.array(z.string().trim().toLowerCase()),
  uri: z
    .string()
    .trim()
    .url({ protocol: /^https?$/ })
    .refine((uri) => !uri.endsWith("/"), {
      error: "URI must not end with a slash",
    }),
  suite: z.string().trim().toLowerCase(),
  component: z.string().trim().toLowerCase(),
  architecture: z.string().trim().toLowerCase(),
  signedBy: z.string().trim(),
});

export type createRepositoryData = z.infer<typeof createRepository>;
