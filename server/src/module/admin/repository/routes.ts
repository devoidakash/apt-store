import express from "express";
import validateSchema from "../../../middleware/validateSchema";
import * as schema from "./schema";
import * as controller from "./controller";

const router = express.Router();

router.get(
  "/repositories",
  validateSchema(schema.repositoryApplicationStatusQuery, "query"),
  controller.getRepositories,
);

router.get(
  "/repositories/:repositoryId",
  validateSchema(schema.repositoryIdParams, "params"),
  controller.getRepositoryById,
);

router.post(
  "/repositories",
  validateSchema(schema.createRepository),
  controller.createRepository,
);

router.patch(
  "/repositories/:repositoryId",
  validateSchema(schema.repositoryIdParams, "params"),
  validateSchema(schema.createRepository),
  controller.updateRepository,
);

export default router;
