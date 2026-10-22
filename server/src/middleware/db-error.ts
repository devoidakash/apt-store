import { NextFunction, Request, Response } from "express";
import ApiError from "../err/api-error";
import REPOSITORY_ERRORS from "../module/admin/repository/error";

interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
}

export function handleDatabaseError(
  error: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  const databaseError = error as DatabaseError;

  if (databaseError.code === "23505") {
    if (databaseError.constraint === "repositories_repo_unique") {
      next(new ApiError(REPOSITORY_ERRORS.REPOSITORY_ALREADY_EXISTS));
      return;
    }
  }

  next(error);
}
