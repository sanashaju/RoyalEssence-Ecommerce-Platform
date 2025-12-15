import { v7 as uuid7 } from "uuid";
import connectDB from "../config/db.js";

export const adminAddProduct = async (req, res) => {
  console.log("add funcion api called >>>>>>", req.body);
  try {
    const {
      productName,
      brand,
      category,
      fragranceType,
      volume,
      shortDescription,
      fullDescription,
      regularPrice,
      discountPrice,
      price,
      stock,
      rating,
    } = req.body;

    const db = await connectDB();

    let productExists = db
      .collection("products")
      .findOne({ productName: productName });

    if (!productExists) {
      return;
    }

    const newProduct = {
      productId: uuid7(),
      productName,
      brand,
      category,
      fragranceType,
      volume,
      shortDescription,
      fullDescription,
      regularPrice,
      discountPrice,
      stock,
      rating,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    const result = db.collection("products").insertOne(newProduct);

    if (result) {
      res.redirect("/admin/dashboard");
    } else {
      res.status(500).json({ message: "Failed to add product" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
