import { Router } from "express";
import {
  adminAddProductPage,
  adminDashboardPage,
  adminLoginPage,
  adminProductsListPage,
} from "../controllers/adminController.js";
import { adminLogin } from "../controllers/adminAuth.js";
import { adminAddProduct, deleteProduct } from "../controllers/productController.js";
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

adminRoutes.get("/products-list", adminProductsListPage);

adminRoutes.post("/perfume/:id/delete", deleteProduct);

export default adminRoutes;
