import { z } from "zod";

// Types
export type ApplicationId = z.infer<typeof applicationId>;

// Schema
export const applicationId = z
  .string()
  .trim()
  .pipe(z.uuid({ error: "Invalid application ID" }));

export const applicationIdParams = z.object({
  applicationId,
});
