import { NextFunction, Request, Response } from "express";
import multer from "multer";
import ApiError from "../err/api-error";

export default function errorHandler(
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

  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File size exceeds allowed limit",
      LIMIT_FILE_COUNT: "Too many files uploaded",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
    };

    return res.status(400).json({
      success: false,
      message: messages[err.code] || err.message,
      code: err.code,
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
