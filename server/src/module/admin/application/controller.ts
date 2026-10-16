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
