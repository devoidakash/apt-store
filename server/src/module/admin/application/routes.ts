import express from "express";
import * as controller from "./controller";
import validateSchema from "../../../middleware/validateSchema";
import * as schema from "./schema";

const router = express.Router();

router.get(
  "/applications",
  validateSchema(schema.applicationStatus, "query"),
  controller.getApplications,
);

router.get(
  "/applications/:applicationId",
  validateSchema(schema.applicationId, "params"),
  controller.getApplicationById,
);

router.patch(
  "/applications/:applicationId",
  validateSchema(schema.applicationId, "params"),
  validateSchema(schema.updateApplication),
  controller.updateApplication,
);

router.patch(
  "/applications/:applicationId/status",
  validateSchema(schema.applicationId, "params"),
  validateSchema(schema.updateApplicationStatus),
  controller.updateApplicationStatus,
);

export default router;
