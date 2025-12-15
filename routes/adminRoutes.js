import { Router } from "express";
import {
  adminAddProductPage,
  adminDashboardPage,
  adminLoginPage,
} from "../controllers/adminController.js";
import { adminLogin } from "../controllers/adminAuth.js";
import { adminAddProduct } from "../controllers/productController.js";

const adminRoutes = Router({ mergeParams: true });

adminRoutes.get("/", adminLoginPage);

adminRoutes.post("/login", adminLogin);

adminRoutes.get("/dashboard", adminDashboardPage);

adminRoutes.get("/add-product", adminAddProductPage);

adminRoutes.post("/add-product", adminAddProduct);

export default adminRoutes;
