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

export const cartPage = async (req, res) => {
  // console.log(">>>>>>>>>>cartpage");
  try {
    const userId = req.loggedInUser?.id; // FIXED
    // console.log(">>>>userId",userId)
    const db = await connectDB();

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });
    if (!user) return res.status(404).send("User not found"); // FIXED
    // console.log(">>>user",user)

    const userCart = user?.cart || [];
    // console.log(">>>>usercart",userCart)

    const subtotal = userCart.reduce((acc, item) => acc + item.total, 0);

    res.render("user/cartPage", {
      title: "Your Cart",
      userCart,
      subtotal,
    });
  } catch (error) {
    res.send("Something went wrong",error);
    console.log(error)
  }
};


export const addToCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.body;

    if (!userId) return res.redirect("/login");
    if (!productId) return res.status(400).send("Product ID required");

    const db = await connectDB();

    /* ---------------- FETCH PRODUCT ---------------- */
    const product = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ productId });

    if (!product) return res.status(404).send("Product not found");

    const stock = Number(product.stock);
    const price = Number(product.discountPrice ?? product.price);

    /* ---------------- CHECK CART ITEM ---------------- */
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne(
        { userId, "cart.productId": productId },
        { projection: { "cart.$": 1 } }
      );

    const currentQty = user?.cart?.[0]?.quantity || 0;

    if (currentQty + 1 > stock) {
      return res.redirect("/cart?error=out_of_stock");
    }

    /* ---------------- UPDATE CART ---------------- */
    if (currentQty > 0) {
      await db.collection(collection.USERS_COLLECTION).updateOne(
        { userId, "cart.productId": productId },
        {
          $inc: { "cart.$.quantity": 1 },
          $set: {
            "cart.$.total": (currentQty + 1) * price,
          },
        }
      );
    } else {
      await db.collection(collection.USERS_COLLECTION).updateOne(
        { userId },
        {
          $push: {
            cart: {
              productId: product.productId,
              productName: product.productName,
              price,
              quantity: 1,
              total: price,
              image: product.thumbnail || "/img/default.png",
              addedAt: new Date(),
            },
          },
        }
      );
    }

    res.redirect("/cart");
  } catch (error) {
    console.error("Add to cart error:", error);
    res.redirect("/cart");
  }
};


export const clearCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectDB();

    // Clear the cart array
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $set: { cart: [] } });

    res.redirect("/cart"); // redirect back to landing page
  } catch (error) {
    // console.log("Error clearing cart:", error);
    res.status(500).send("Something went wrong while clearing the cart");
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectDB();

    // Remove the item from the cart array
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $pull: { cart: { productId: productId } } });

    res.redirect("/cart"); // Redirect back to landing page
  } catch (error) {
    // console.log("Error removing item from cart:", error);
    res.status(500).send("Something went wrong");
  }
};


export const checkoutPage = async (req, res) => {
  console.log(">>>>called checkout function")
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectDB();
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    const userCart = user.cart || [];
    const addresses = user.addresses || []; // ✅ Get saved addresses

    // Calculate total
    const total = userCart.reduce((acc, item) => acc + item.total, 0);

    res.render("user/checkoutPage", {
      title: "Checkout",
      userCart,
      total,
      addresses, // ✅ Pass to HBS
    });
  } catch (error) {
    // console.error(error);
    res.send("Something went wrong");
  }
};