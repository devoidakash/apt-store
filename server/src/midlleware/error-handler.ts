import { Request, Response, NextFunction } from "express";
import ApiError from "../errors/api-error";

export default function errorHandle(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err?.errors?.length ? { errors: err.errors } : {}),
    });
  }

  if (err instanceof Error) {
    console.error(" Error Details:", {
      url: req.url,
      error: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error. Please try again after a while.",
    code: "INTERNAL_ERROR",
  });
}
