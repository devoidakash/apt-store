import express from "express";

const router = express.Router();

import * as controller from "./controller";

router.get("/applications", controller.getApplications);

export default router;
