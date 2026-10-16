import { Request, Response } from "express";
import * as service from "./service";

export async function getRepositories(req: Request, res: Response) {
  const data = await service.getRepositories();
  res.status(200).json({
    success: true,
    message: "Repositories fetched successfully",
    data,
  });
}

export async function getRepositoryById(req: Request, res: Response) {
  const repositoryId = Array.isArray(req.params.repositoryId)
    ? req.params.repositoryId[0]
    : req.params.repositoryId;
  const data = await service.getRepositoryById(repositoryId);
  res.status(200).json({
    success: true,
    message: "Repository fetched successfully",
    data,
  });
}

export async function createRepository(req: Request, res: Response) {
  const data = await service.createRepository(req.body);
  res.status(201).json({
    success: true,
    message: "Repository added successfully",
    data,
  });
}
