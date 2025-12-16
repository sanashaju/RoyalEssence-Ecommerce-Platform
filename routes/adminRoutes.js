import { Router } from "express";
import {
  adminAddProductPage,
  adminDashboardPage,
  adminLoginPage,
} from "../controllers/adminController.js";
import { adminLogin } from "../controllers/adminAuth.js";
import { adminAddProduct } from "../controllers/productController.js";
import { uploadFiles } from "../middleware/uploadMiddleware.js";

const adminRoutes = Router({ mergeParams: true });

adminRoutes.get("/", adminLoginPage);

adminRoutes.post("/login", adminLogin);

adminRoutes.get("/dashboard", adminDashboardPage);

adminRoutes.get("/add-product", adminAddProductPage);

adminRoutes.post(
  "/add-product",
  uploadFiles("userAssets/uploads", "fields", null, null, [
    { name: "thumbnail", maxCount: 1 },
    { name: "productImages", maxCount: 3 },
  ]),
  adminAddProduct
);

adminRoutes.post("/add-product", adminAddProduct);

export default adminRoutes;
