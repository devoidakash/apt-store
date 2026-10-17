import sharp from "sharp";
import type { Request, Response, NextFunction } from "express";
import ERROR_CODES from "../err/error-code";
import ApiError from "../err/api-error";

const ALLOWED_FORMATS = ["jpeg", "png", "webp"];

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

    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        await validateFileBuffer(file);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

async function validateFileBuffer(file: Express.Multer.File): Promise<void> {
  try {
    const image = sharp(file.buffer, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    });

    const metadata = await image.metadata();

    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      throw new ApiError(ERROR_CODES.FILE_TYPE_MISMATCH);
    }

    file.buffer = await image.webp().toBuffer();
    file.mimetype = "image/webp";
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(ERROR_CODES.INVALID_FILE_CONTENT);
  }
}
