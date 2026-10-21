import { z } from "zod";

// Types
export type ApplicationStatus = z.infer<typeof applicationStatus>;

export type ApplicationId = z.infer<typeof applicationId>;

export type UpdateApplication = z.infer<typeof updateApplication>;

// Schemas
export const applicationStatus = z.enum(["draft", "published"], {
  error: "Status must be either 'draft' or 'published'",
});

export const applicationId = z
  .string()
  .trim()
  .pipe(z.uuid({ error: "Invalid application ID" }));

export const updateApplication = z.object({
  displayName: z.string().trim().min(1).max(100),
  caption: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(2000),
  category: z.string().trim().min(1).max(50),
  homepageUri: z
    .string()
    .trim()
    .pipe(z.url({ protocol: /^https?$/ }))
    .refine((uri) => !uri.endsWith("/"), {
      error: "Homepage url must not end with a slash",
    }),
});
