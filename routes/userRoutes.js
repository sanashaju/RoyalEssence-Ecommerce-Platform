import express from "express";
import { accountDetailsPage, addToCart, cartPage, checkoutPage, clearCart, createAddress, getOrderHistory, getWishlistPage, landingPage, loginPage, orderSuccess, placeOrder, productDeatilsPage, removeFromCart, signupPage } from "../controllers/userController.js";
import { login, logOut, signup } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get("/", landingPage); 

userRoutes.get("/login", loginPage); 

userRoutes.get("/signup", signupPage);

userRoutes.post("/signup", signup);

userRoutes.post("/login", login);

userRoutes.get("/logout", logOut);

userRoutes.get("/account-details", accountDetailsPage);

userRoutes.get("/productDetails", productDeatilsPage);

userRoutes.get("/cart", cartPage );

userRoutes.post("/add-to-cart", addToCart );

userRoutes.get("/cart/clear", clearCart);

userRoutes.get("/cart/remove/:productId", removeFromCart);

userRoutes.get("/checkout", checkoutPage);

userRoutes.post("/create-address", createAddress);

userRoutes.post("/place-order", placeOrder);

userRoutes.get("/order-success", orderSuccess);

userRoutes.get("/order-history", requireAuth, getOrderHistory);

userRoutes.get("/wishlist", requireAuth, getWishlistPage);



export default userRoutes;
