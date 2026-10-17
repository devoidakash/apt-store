import { Request, Response, NextFunction } from "express";
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
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const applicationId = req.params.applicationId as string;
  const data = await service.getApplicationById(applicationId);

  res.status(200).json({
    success: true,
    message: "Application fetched successfully",
    data,
  });
}
