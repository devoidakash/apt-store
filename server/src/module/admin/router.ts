import express from "express";
import adminRepository from "../admin/repository/routes";

const router = express.Router();

router.use(adminRepository);

export default router;
