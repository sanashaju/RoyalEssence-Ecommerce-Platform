import connectDB from "../config/db.js";
import collection from "../config/collection.js";
import { ObjectId } from "mongodb";

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

export const editProductPage = async (req, res) => {
  console.log("edit productPage function called>>>>>>");
  try {
    const id = req.params.id;

    const db = await connectDB();
    const product = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(req.params.id) });

    console.log(product);

    // Render dashboard
    res.render("admin/edit-product", {
      layout: "admin",
      title: "Admin - Edit Product",
      product: product,
      brands: [
        "Belle",
        "Blue Lady",
        "Coach",
        "DavidOff",
        "YVES Saint Laurent",
        "Dior",
        "Dolce",
        "Givenchy",
        "Jimmy Choo",
        "Kayali",
        "Kenzo",
        "Narciso Rodrigues",
        "Paco Rabanne",
        "Poison Dior",
        "Shalimar",
        "Skinn",
      ],
      fragranceTypes: [
        "Fresh / Citrus",
        "Woody",
        "Oriental / Spicy",
        "Aromatic / Herbal",
        "Fruity",
        "Incense",
        "Floral",
        "White Floral",
        "Gourmand",
        "Oriental / Amber",
        "Aquatic / Marine",
        "Floral-Fruity",
        "Honeyed",
        "Ozonic",
        "Chypre",
      ],
      volumes: ["50 ML", "100 ML", "150 ML", "200 ML", "250 ML", "300 ML"],
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Something went wrong loading the dashboard.");
  }
};


export const adminOrdersListPage = async (req, res) => {
  console.log("Admin OrdersList route working 🚀");
  try {
    const db = await connectDB( );

    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);
    const usersCollection = db.collection(collection.USERS_COLLECTION);

    // Fetch all orders sorted by newest
    const orders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Map orders to include totals and user email
    const ordersWithTotals = await Promise.all(
      orders.map(async (order) => {
        // Calculate totals for cart items
        const cartWithTotal = order.userCart.map((item) => ({
          ...item,
          total: item.total || item.price * item.quantity,
        }));
        const totalAmount = cartWithTotal.reduce(
          (acc, item) => acc + item.total,
          0
        );

        // Fetch email from users collection using string UUID
        let userEmail = "N/A";
        if (order.userId) {
          try {
            // Make sure this matches the field storing UUID in your users collection
            const user = await usersCollection.findOne({
              userId: order.userId,
            });
            if (user && user.email) userEmail = user.email;
          } catch (err) {
            // console.log("Error fetching user email for order:", order._id, err);
          }
        }

        return {
          ...order,
          userCart: cartWithTotal,
          totalAmount,
          userEmail, // now guaranteed to exist if user is found
        };
      })
    );

    // Render the admin orders list page
    res.render("admin/ordersList", {
      layout: "admin",
      title: "Admin - Orders List",
      orders: ordersWithTotals,
    });
  } catch (error) {
    // console.error("Error loading admin orders list:", error);
    res
      .status(500)
      .send("Something went wrong while loading orders for admin.");
  }
};