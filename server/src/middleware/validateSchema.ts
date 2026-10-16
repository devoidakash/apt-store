import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import ApiError from "../err/api-error";

type RequestSource = "body" | "query" | "params";

export default function validateSchema(
  schema: z.ZodType,
  source: RequestSource = "body",
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new ApiError({
        statusCode: 400,
        message: "Invalid request data",
        code: "VALIDATION_ERROR",
        errors: result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    }

    if (source === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    } else {
      (req as any)[source] = result.data;
    }

    next();
  };
}
