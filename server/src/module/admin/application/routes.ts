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

export default router;
