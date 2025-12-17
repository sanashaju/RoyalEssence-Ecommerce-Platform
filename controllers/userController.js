import { bannerData, fragranceTypesData, brandsData } from "../data/index.js";
import { getProductsData } from "./productController.js";
import jwt from "jsonwebtoken";

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
      menProducts: withStockStatus(latestMen),
      womenProducts: withStockStatus(latestWomen),
      newArrivals: withStockStatus(newArrivals),
    });
  } catch (error) {
    console.error("❌ Landing page error:", error);
    res.status(500).render("error/500");
  }
};
