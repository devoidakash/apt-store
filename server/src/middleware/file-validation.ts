import type { NextFunction, Request, Response } from "express";
import { fileTypeFromBuffer } from "file-type";
import ApiError from "../err/api-error";
import ERROR_CODES from "../err/error-code";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function validateFileType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file && !req.files) {
      throw new ApiError(ERROR_CODES.FILE_REQUIRED);
    }

    if (req.file) {
      await validateFileBuffer(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          await validateFileBuffer(file);
        }
      } else {
        for (const files of Object.values(req.files)) {
          for (const file of files) {
            await validateFileBuffer(file);
          }
        }
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

async function validateFileBuffer(file: Express.Multer.File): Promise<void> {
  const type = await fileTypeFromBuffer(file.buffer);

  if (!type) {
    throw new ApiError(ERROR_CODES.INVALID_FILE_CONTENT);
  }

  if (!ALLOWED_TYPES.includes(type.mime)) {
    throw new ApiError(ERROR_CODES.FILE_TYPE_MISMATCH);
  }
}
