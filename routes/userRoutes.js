import express from "express";
import { accountDetailsPage, landingPage, loginPage, productDeatilsPage, signupPage } from "../controllers/userController.js";
import { login, logOut, signup } from "../controllers/authController.js";

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get("/", landingPage); 

userRoutes.get("/login", loginPage); 

userRoutes.get("/signup", signupPage);

userRoutes.post("/signup", signup);

userRoutes.post("/login", login);

userRoutes.get("/logout", logOut);

userRoutes.get("/account-details", accountDetailsPage);

userRoutes.get("/productDetails", productDeatilsPage);


export default userRoutes;
