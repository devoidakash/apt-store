import { Request, Response } from "express";
import * as service from "./service";
import { ApplicationId, ApplicationStatus, UpdateApplication } from "./schema";

export async function getApplications(
  req: Request<{}, {}, {}, { applicationStatus: ApplicationStatus }>,
  res: Response,
) {
  const data = await service.getApplications(req.query.applicationStatus);
  res.json({
    success: true,
    message: "Applications fetched successfully",
    data,
  });
}

export async function getApplicationById(
  req: Request<{ applicationId: ApplicationId }>,
  res: Response,
) {
  const data = await service.getApplicationById(req.params.applicationId);

  res.status(200).json({
    success: true,
    message: "Application fetched successfully",
    data,
  });
}

export async function updateApplication(
  req: Request<{ applicationId: ApplicationId }, {}, UpdateApplication>,
  res: Response,
) {
  await service.updateApplication(req.params.applicationId, req.body);

  res.status(200).json({
    success: true,
    message: "Application updated successfully",
  });
}

export async function updateApplicationIcon(
  req: Request<{ applicationId: ApplicationId }>,
  res: Response,
) {
  await service.updateApplicationIcon(req.params.applicationId, req.file!);

  res.status(200).json({
    success: true,
    message: "Application icon updated successfully",
  });
}

export async function updateApplicationImages(
  req: Request<{ applicationId: ApplicationId }>,
  res: Response,
) {
  await service.updateApplicationImages(
    req.params.applicationId,
    req.files as Express.Multer.File[],
  );

  res.status(200).json({
    success: true,
    message: "Application images updated successfully",
  });
}

export async function updateApplicationStatus(
  req: Request<
    { applicationId: ApplicationId },
    {},
    { status: ApplicationStatus }
  >,
  res: Response,
) {
  await service.updateApplicationStatus(
    req.params.applicationId,
    req.body.status,
  );

  res.status(200).json({
    success: true,
    message: "Application status updated successfully",
  });
}
