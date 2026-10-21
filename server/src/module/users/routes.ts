import express from "express";
import validateSchema from "../../middleware/validateSchema";
import * as controller from "./controller";
import { applicationIdParams } from "./schema";

const router = express.Router();

router.get("/applications", controller.getApplications);

router.get(
  "/applications/:applicationId",
  validateSchema(applicationIdParams, "params"),
  controller.getAppllicationById,
);

export default router;
