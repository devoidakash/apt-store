import express from "express";
import adminRoutes from "../module/admin/router";
const router = express.Router();

router.use("/admin", adminRoutes);

export default router;
