import express from "express";

const router = express.Router();

import * as controller from "./controller";

router.get("/applications", controller.getApplications);

router.get("/applications/:applicationId", controller.getAppllicationById);

export default router;
