import { Router } from "express";
import {
  adminAddProductPage,
  adminDashboardPage,
  adminLoginPage,
  adminOrderDetailsPage,
  adminOrdersListPage,
  adminProductsListPage,
  blockUnblockUser,
  editProductPage,
  updateOrderStatus,
  usersListPage,
} from "../controllers/adminController.js";
import { adminLogin } from "../controllers/adminAuth.js";
import {
  adminAddProduct,
  deleteProduct,
  editProduct,
} from "../controllers/productController.js";
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

adminRoutes.post("/product/:id/delete", deleteProduct);

adminRoutes.get("/product/edit/:id", editProductPage);

adminRoutes.post("/product/edit/:id", editProduct);

adminRoutes.get("/orders-list", adminOrdersListPage);

adminRoutes.get("/update-order-status/:id/:status", updateOrderStatus);

adminRoutes.get("/orders/:id", adminOrderDetailsPage);

adminRoutes.get("/users-list", usersListPage);

adminRoutes.post("/block-user/:id", blockUnblockUser);

export default adminRoutes;
