import { z } from "zod";

export const applicationStatus = z.object({
  applicationStatus: z.enum(["live", "draft"], {
    error: "Status must be either 'live' or 'draft'.",
  }),
});
