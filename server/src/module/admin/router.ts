import express from "express";
import adminRepository from "../admin/repository/routes";
import adminApplication from "../admin/application/routes";

const router = express.Router();

router.use(adminRepository);
router.use(adminApplication);

export default router;
