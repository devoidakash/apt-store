import { Request, Response } from "express";
import * as service from "./service";
export async function createRepository(req: Request, res: Response) {
  const data = await service.createRepository(req.body);
  res.status(201).json({
    success: true,
    message: "Repository added successfully",
    data,
  });
}
