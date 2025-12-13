import { Router } from "express";
import { adminDashboardPage, adminLoginPage } from "../controllers/adminController.js";
import { adminLogin } from "../controllers/adminAuth.js";

const adminRoutes = Router({ mergeParams: true });

adminRoutes.get("/", adminLoginPage);

adminRoutes.post("/login", adminLogin);

adminRoutes.get("/dashboard", adminDashboardPage);


export default adminRoutes;
