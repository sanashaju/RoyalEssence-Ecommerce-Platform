import jwt from "jsonwebtoken";
import collection from "../config/collection.js";
import connectDB from "../config/db.js";
import { bannerData, fragranceTypesData, brandsData } from "../data/index.js";
import { getProductsData } from "./productController.js";

export const landingPage = async (req, res) => {
  console.log("🚀 landingPage function called");

  try {
    let user = null;
    const token = req.cookies?.token;

    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.warn("⚠️ Invalid JWT:", err.message);
      }
    }

    const [featuredProducts, latestMen, latestWomen, newArrivals] =
      await Promise.all([
        getProductsData({ sort: "random", limit: 12 }),
        getProductsData({ category: "Men", sort: "latest", limit: 10 }),
        getProductsData({ category: "Women", sort: "latest", limit: 10 }),
        getProductsData({ sort: "latest", limit: 15 }),
      ]);

    const getStockStatus = ({ stock }) => {
      if (stock > 20) return `🟢 Available (${stock})`;
      if (stock > 0) return `🟠 Hurry up! Only ${stock} left`;
      return `🔴 Currently unavailable`;
    };

    const withStockStatus = (products = []) =>
      products.map((product) => ({
        ...product,
        stockStatus: getStockStatus(product),
      }));

    res.render("user/homePage", {
      title: "Home - Royal Essence",
      user,
      banners: bannerData,
      brands: brandsData,
      fragranceTypes: fragranceTypesData,
      featuredProducts: withStockStatus(featuredProducts),
      latestMen: withStockStatus(latestMen),
      latestWomen: withStockStatus(latestWomen),
      newArrivals: withStockStatus(newArrivals),
    });
    console.log(">>>>>>>>/////", fragranceTypesData);
  } catch (error) {
    console.error("❌ Landing page error:", error);
    res.status(500).render("error/500");
  }
};

export const loginPage = (req, res) => {
  console.log("🚀 loginPage function called");
  try {
    res.render("user/loginPage", {
      title: "Login - Royal Essence",
    });
  } catch (error) {
    console.error("❌ Login page error:", error);
    res.status(500).render("error/500");
  }
};

export const signupPage = (req, res) => {
  console.log("🚀 signupPage function called");
  try {
    res.render("user/signupPage", {
      title: "Signup - Royal Essence",
    });
  } catch (error) {
    console.error("❌ Signup page error:", error);
    res.status(500).render("error/500");
  }
};

export const accountDetailsPage = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = await connectDB();

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId: decoded.id });

    if (!user) return res.redirect("/login");

    // ❌ remove password before sending
    delete user.password;
    console.log("user Data ><><><><>", user);

    res.render("user/accountDetails", {
      title: "Account Details - Royal Essence",
      user,
    });
  } catch (error) {
    console.error("Account details error:", error);
    res.redirect("/login");
  }
};

export const productDeatilsPage = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Product ID is required");

    const db = await connectDB();

    const productData = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ productId: id });

    if (!productData) return res.status(404).send("Product not found");

    const getStockStatus = (stock) => {
      if (stock > 20) return `🟢 Available (${stock})`;
      if (stock > 0) return `🟠 Hurry up! Only ${stock} left`;
      return `🔴 Currently unavailable`;
    };

    // Main product stock status
    productData.stockStatus = getStockStatus(productData.stock);

    const relatedProducts = await getProductsData({
      category: productData.category,
      limit: 4,
    });

    // Related products stock status
    const updatedRelatedProducts = relatedProducts.map((product) => ({
      ...product,
      stockStatus: getStockStatus(product.stock),
    }));
    console.log("productData>>>", productData);
    console.log("updatedRelatedProducts >>>>", updatedRelatedProducts);

    res.render("user/productDetails", {
      title: "Product Details - Royal Essence",
      product: productData,
      relatedProducts: updatedRelatedProducts,
    });
  } catch (error) {
    console.error("❌ Product details page error:", error);
    res.status(500).render("error/500");
  }
};
