import jwt from "jsonwebtoken";
import collection from "../config/collection.js";
import connectDB from "../config/db.js";
import { bannerData, fragranceTypesData, brandsData } from "../data/index.js";
import { getProductsData } from "./productController.js";
import { v7 as uuidv7 } from "uuid";
import { ObjectId } from "mongodb";

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
    // console.log(">>>>>>>>/////", fragranceTypesData);
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



export const createAddress = async (req, res) => {
  
  try {
    const userId = req.loggedInUser?.id;
    
    if (!userId) {
      return res.redirect("/login");
    }

    const { billingName, address, landmark, phone } = req.body;

    if (!billingName || !address || !phone) {
      // console.log("❌ Required fields missing");
      return res.status(400).send("All required fields must be filled");
    }

    const db = await connectDB();
    // console.log("✅ Database connected");

    // ✅ IMPORTANT: Match using userId instead of _id
    const result = await db.collection(collection.USERS_COLLECTION).updateOne(
      { userId: userId },
      {
        $push: {
          addresses: {
            billingName,
            address,
            landmark: landmark || "",
            phone,
            createdAt: new Date(),
          },
        },
      }
    );

    // console.log("Update Result:", {
    //   matched: result.matchedCount,
    //   modified: result.modifiedCount,
    // });

    if (result.modifiedCount === 0) {
      // console.log("⚠️ Address not added. Possible wrong userId match.");
      return res.status(500).send("Failed to add address");
    }

    // console.log("✅ Address added successfully. Redirecting...");
    res.redirect("/user/checkoutPage");
  } catch (error) {
    // console.error("🔥 Error creating address:", error);
    res.status(500).send("Internal Server Error");
  }
};


export const placeOrder = async (req, res) => {

  
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    const db = await connectDB();

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });


    if (!user) return res.status(404).send("User not found");

    const userCart = user.cart || [];
    if (userCart.length === 0) return res.redirect("/cart");

    // Handle address
    let orderAddress;
    if (user.addresses?.length && req.body.selectedAddress !== undefined) {
      const index = parseInt(req.body.selectedAddress);
      orderAddress = user.addresses[index];
    } else if (req.body.billingName && req.body.address && req.body.phone) {
      orderAddress = {
        billingName: req.body.billingName,
        address: req.body.address,
        landmark: req.body.landmark || "",
        phone: req.body.phone,
        createdAt: new Date(),
      };
      await db
        .collection(collection.USERS_COLLECTION)
        .updateOne({ userId }, { $push: { addresses: orderAddress } });
    } else {
      return res.status(400).send("Address details missing");
    }

    // ----- STOCK CHECK -----
      for (let item of userCart) {

      const product = await db
        .collection(collection.PRODUCTS_COLLECTION)
        .findOne({ productId: item.productId });

        console.log("???????? Product", product)

      if (!product) {
        return res
          .status(404)
          .send(`Product ${item.title} not found in database`);
      }

      if (product.stock === undefined || product.stock < item.quantity) {
        return res
          .status(400)
          .send(`Not enough stock for product: ${item.name}`);
      }
    }

    // ----- DEDUCT STOCK -----
    for (let item of userCart) {
      await db.collection(collection.PRODUCTS_COLLECTION).updateOne(
        { _id: new ObjectId(item._id) },
        { $inc: { stock: -item.quantity } } // decrement stock
      );
    }

    // ----- CREATE ORDER -----
    const order = {
      orderId: uuidv7(),
      userId,
      userCart,
      address: orderAddress,
      paymentMethod: req.body.payment_option,
      total: userCart.reduce((acc, item) => acc + item.total, 0),
      status: req.body.payment_option === "COD" ? "Pending" : "Paid",
      createdAt: new Date(),
    };


    const result = await db
      .collection(collection.ORDERS_COLLECTION)
      .insertOne(order);
    const orderId = result.insertedId;

    await db.collection(collection.USERS_COLLECTION).updateOne(
      { userId },
      { $push: { orders: orderId }, $set: { cart: [] } } // add order and clear cart
    );

    res.redirect("/order-success");
  } catch (error) {
    // console.error("🔥 Error placing order:", error);
    res.status(500).send("Something went wrong while placing the order.");
  }
};


export const orderSuccess = async (req, res) => {

  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    const db = await connectDB();

    // Fetch the last order for this user
    const lastOrder = await db
      .collection(collection.ORDERS_COLLECTION)
      .findOne({ userId }, { sort: { createdAt: -1 } });

    if (!lastOrder) {
      // console.log("No order found for this user.");
      return res.redirect("/");
    }

    // Ensure each cart item has a total
    const cartWithTotal = lastOrder.userCart.map((item) => ({
      ...item,
      total: item.total || item.price * item.quantity,
    }));

    // Calculate total order amount
    const totalAmount = cartWithTotal.reduce(
      (acc, item) => acc + item.total,
      0
    );

    res.render("user/orderSuccess", {
      orderId: lastOrder._id,
      email: req.loggedInUser.email,
      billingName: lastOrder.address.billingName,
      address: lastOrder.address.address,
      landmark: lastOrder.address.landmark,
      phone: lastOrder.address.phone,
      userCart: cartWithTotal,
      total: totalAmount,
    });
  } catch (error) {
    // console.error("Error rendering order success page:", error);
    res
      .status(500)
      .send("Something went wrong while loading the order success page.");
  }
};


export const getOrderHistory = async (req, res) => {

  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    // Connect to database
    const db = await connectDB();

    // Fetch all orders for this user, newest first
    const orders = await db
      .collection(collection.ORDERS_COLLECTION)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    if (!orders || orders.length === 0) {
      // console.log("No orders found for this user.");
      return res.render("user/order-history", { orders: [] });
    }

    // Format orders: add cart totals and full totalAmount per order
    const formattedOrders = orders.map((order) => {
      const cartWithTotal = order.userCart.map((item) => ({
        ...item,
        total: item.total || item.price * item.quantity,
      }));

      const totalAmount = cartWithTotal.reduce(
        (acc, item) => acc + item.total,
        0
      );

      return {
        ...order,
        userCart: cartWithTotal,
        totalAmount,
      };
    });

    // ✅ Render the correct view inside "views/user/order-history.hbs"
    res.render("user/order-history", { orders: formattedOrders });
  } catch (error) {
    // console.error("Error loading order history page:", error);
    res.status(500).send("Something went wrong while loading order history.");
  }
};


export const getWishlistPage = async (req, res) => {
  // console.log(">>>>>>wishlist page function called");
  try {
    const userId = req.loggedInUser?.id;
    console.log(">>>>>userId", userId);

    if (!userId) return res.redirect("/login");

    const db = await connectDB();

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    const wishlistItems = user?.wishlist || [];

    if (!wishlistItems.length)
      return res.render("user/wishlist", { wishlist: [] });

    // Extract productId as strings (UUIDs, not ObjectIds)
    const productId = wishlistItems.map((item) => item.productId);

    // Query using string UUIDs instead of ObjectIds
    const products = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .find({ productId: { $in: productId } })
      .toArray();

    const wishlist = wishlistItems
      .map((item) => {
        const product = products.find(
          (p) => p.productId === item.productId // Compare as strings
        );
        if (!product) {
          console.log("⚠ Book deleted from DB:", item.productId);
          return null;
        }

        return {
          productId: item.productId,
          productName: product.productName,
          brand: product.brand,
          price: product.discountPrice || product.price,
          image: product.thumbnail,
          shortDescription: product.shortDescription || "",
          stockStatus: product.stockStatus> 0,       
        };
      })
      .filter(Boolean);

    res.render("user/wishlist", { title: "Your Wishlist", wishlist });

  } catch (err) {
    console.error("❌ Wishlist Page Error:", err);
    res.redirect("/");
  }
};


