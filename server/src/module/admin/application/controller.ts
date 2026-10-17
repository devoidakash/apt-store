import { Request, Response } from "express";
import * as service from "./service";
import ApiError from "../../../err/api-error";
import ERROR_CODES from "../../../err/error-code";

export async function getApplications(req: Request, res: Response) {
  const data = await service.getApplications(
    req.query.applicationStatus as string,
  );
  res.json({
    success: true,
    message: "Applications fetched successfully",
    data,
  });
}

export async function getApplicationById(req: Request, res: Response) {
  const applicationId = req.params.applicationId as string;
  const data = await service.getApplicationById(applicationId);

  res.status(200).json({
    success: true,
    message: "Application fetched successfully",
    data,
  });
}

export async function updateApplication(req: Request, res: Response) {
  const applicationId = req.params.applicationId as string;
  await service.updateApplication(applicationId, req.body);

  res.status(200).json({
    success: true,
    message: "Application updated successfully",
  });
}

export async function updateApplicationIcon(req: Request, res: Response) {
  const applicationId = req.params.applicationId as string;
  await service.updateApplicationIcon(applicationId, req.file!);

  res.status(200).json({
    success: true,
    message: "Application icon updated successfully",
  });
}

export async function updateApplicationImages(req: Request, res: Response) {
  const applicationId = req.params.applicationId as string;
  const files = Array.isArray(req.files) ? req.files : [];
  await service.updateApplicationImages(applicationId, files!);

  res.status(200).json({
    success: true,
    message: "Application images updated successfully",
  });
}

export async function updateApplicationStatus(req: Request, res: Response) {
  const applicationId = req.params.applicationId as string;
  await service.updateApplicationStatus(applicationId, req.body.status);

  res.status(200).json({
    success: true,
    message: "Application status updated successfully",
  });
}
