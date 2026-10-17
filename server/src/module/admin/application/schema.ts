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
    displayName: z.string().trim().min(2).max(20).optional(),
    caption: z.string().trim().min(5).max(50).optional(),
    description: z.string().trim().min(10).max(500).optional(),
    category: z.string().trim().min(2).max(10).optional(),
    homepage: z.url().optional(),
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
