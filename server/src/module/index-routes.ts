import express from "express";
import adminRoutes from "../module/admin/router";
import usersRoutes from "../module/users/router";

const router = express.Router();

router.use("/admin", adminRoutes);
router.use("/", usersRoutes);

export default router;
