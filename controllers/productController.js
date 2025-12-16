import { v7 as uuid7 } from "uuid";
import connectDB from "../config/db.js";
import collection from "../config/collection.js";

export const adminAddProduct = async (req, res) => {
  console.log("add funcion api called >>>>>>", req.body);
  console.log("create product route working >>>>>>>>");
  console.log("Body:", req.body);
  console.log("Files:", req.files);
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
      stock,
      rating,
    } = req.body;

    // Thumbnail (single)
    const thumbnail = req.files?.thumbnail?.[0]?.filename || null;

    //Product Images (multiple)
    const productImages =
      req.files?.productImages?.map(
        (file) => `/userAssets/uploads/${file.filename}`
      ) || [];

    const db = await connectDB();

    let productExists = db
      .collection(collection.PRODUCTS_COLLECTION)
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
      price: parseInt(regularPrice),
      discountPrice: parseInt(discountPrice),
      stock: parseInt(stock),
      rating: parseInt(rating),
      thumbnail: `/userAssets/uploads/${thumbnail}`,
      images: productImages,
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
