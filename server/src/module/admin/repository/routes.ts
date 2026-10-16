import express from "express";
import validateSchema from "../../../middleware/validateSchema";
import * as schema from "./schema";
import * as controller from "./controller";

const router = express.Router();

router.get("/repositories", controller.getRepositories);

router.post(
  "/repositories",
  validateSchema(schema.createRepository),
  controller.createRepository,
);

export default router;
