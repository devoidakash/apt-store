import { Request, Response } from "express";
import * as service from "./service";

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
  const applicationId = Array.isArray(req.params.applicationId)
    ? req.params.applicationId[0]
    : req.params.applicationId;
  const data = await service.getApplicationById(applicationId);

  res.status(200).json({
    success: true,
    message: "Application fetched successfully",
    data,
  });
}
