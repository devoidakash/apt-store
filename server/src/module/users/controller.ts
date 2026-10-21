import { NextFunction, Request, Response } from "express";
import { ApplicationId } from "./schema";
import * as service from "./service";

export async function getApplications(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const data = await service.getApplications();
  res.json({
    success: true,
    message: "Applications fetched successfully",
    data,
  });
}

export async function getAppllicationById(
  req: Request<{ applicationId: ApplicationId }>,
  res: Response,
  next: NextFunction,
) {
  const data = await service.getApplicationById(req.params.applicationId);

  res.status(200).json({
    success: true,
    message: "Application fetched successfully",
    data,
  });
}
