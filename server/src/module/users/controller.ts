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
