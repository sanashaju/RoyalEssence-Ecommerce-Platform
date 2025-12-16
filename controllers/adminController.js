import connectDB from "../config/db.js";
import collection from "../config/collection.js";

export const adminLoginPage = async (req, res) => {
  res.render("admin/adminLogin", { layout: "admin", title: "Admin Login" });
};

export const adminDashboardPage = async (req, res) => {
  try {
    // Render dashboard
    res.render("admin/dashboard", {
      layout: "admin",
      title: "Admin Dashboard",
    });
  } catch (error) {
    res.status(500).send("Something went wrong loading the dashboard.");
  }
};

export const adminAddProductPage = async (req, res) => {
  // console.log("Admin AddProduct route working 🚀");
  try {
    res.render("admin/add-product", {
      layout: "admin",
      title: "Admin - Add Product",
    });
  } catch (error) {
    res.status(500).send("Something went wrong on add Product Page.");
  }
};

export const adminProductsListPage = async (req, res) => {
  try {
    const db = await connectDB();
    const products = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .find({})
      .toArray();
    console.log(products);

    res.render("admin/products-list", {
      layout: "admin",
      title: "Admin - Products List",
      products: products,
    });
  } catch (error) {
    console.log("Error fetching products:", error);
    res.status(500).send("Something went wrong on Products List Page.");
  }
};
