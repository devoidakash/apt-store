import express from "express";
import upload from "../../../middleware/file-upload";
import validateFileType from "../../../middleware/file-validation";
import validateSchema from "../../../middleware/validateSchema";
import * as controller from "./controller";
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
  "/applications/:applicationId/icon",
  validateSchema(schema.applicationId, "params"),
  upload(0, 1, 1 * 1024 * 1024).single("icon"),
  validateFileType,
  controller.updateApplicationIcon,
);

router.post(
  "/applications/:applicationId/images",
  validateSchema(schema.applicationId, "params"),
  upload(0, 5, 2 * 1024 * 1024).array("images", 5),
  validateFileType,
  controller.updateApplicationImages,
);

router.patch(
  "/applications/:applicationId/status",
  validateSchema(schema.applicationId, "params"),
  validateSchema(schema.applicationStatus),
  controller.updateApplicationStatus,
);

export default router;
