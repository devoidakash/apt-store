import { z } from "zod";

export const applicationStatus = z.object({
  applicationStatus: z.enum(["live", "draft"], {
    error: "Status must be either 'live' or 'draft'.",
  }),
});

export const applicationId = z.object({
  applicationId: z.string().trim().uuid({ message: "Invalid application ID" }),
});

export const updateApplication = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    caption: z.string().trim().max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    category: z.string().trim().min(1).max(50).optional(),
    homepage: z.string().trim().url().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateApplicationData = z.infer<typeof updateApplication>;

export const updateApplicationStatus = z.object({
  status: z.enum(["live", "draft"]),
});

export type ApplicationStatus = z.infer<
  typeof updateApplicationStatus
>["status"];
