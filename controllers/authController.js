import connectDB from "../config/db.js";
import collection from "../config/collection.js";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  // console.log("🚀 signup function called");
  // console.log("request body>>>>>>>", req.body);
  try {
    const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {
      return res.render("user/signupPage", {
        title: "Signup - Royal Essence",
        error: "Name, email, and password are required.",
      });
    }

    const db = await connectDB();

    // Check already exists
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ email });
    console.log("user colsled>>>", user);
    if (user) {
      return res.render("user/signupPage", {
        title: "Signup - Royal Essence",
        error: "User already exists. Please login instead.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = uuidv7();

    // Insert user
    await db.collection(collection.USERS_COLLECTION).insertOne({
      userId,
      name,
      email,
      password: passwordHash,
      phone: "",
      avatar: "",
      addresses: [],
      orders: [],
      wishlist: [],
      cart: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isBlocked: false,
    });

    return res.redirect("/login");
  } catch (err) {
    return res.render("user/signupPage", {
      title: "Signup - Royal Essence",
      error: "Something went wrong. Please try again later.",
    });
  }
};

export const login = async (req, res) => {
  console.log("login user funtion called")
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.render("user/loginPage", {
        title: "Login - Royal Essence",
        error: "Email and password are required.",
      });
    }

    const db = await connectDB();

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ email });

    if (!user) {
      return res.render("user/loginPage", {
        title: "Login - Royal Essence",
        error: "User does not exist. Please sign up first.",
      });
    }

    // Blocked user check
    if (user.isBlocked) {
      return res.render("user/login", {
        title: "Login - Royal Essence",
        error: "Your account has been blocked. Please contact support.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("user/loginPage", {
        title: "Login - Royal Essence",
        error: "Invalid password. Please try again.",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.userId, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    // Store token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.redirect("/");
  } catch (err) {
    return res.render("user/loginPage", {
      title: "Login - Royal Essence",
      error: "Something went wrong. Please try again later.",
    });
  }
};

export const logOut = (req, res) => {
  res.clearCookie("token");
  return res.redirect("/login");
};