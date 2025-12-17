import { v7 as uuid7 } from "uuid";
import connectDB from "../config/db.js";
import collection from "../config/collection.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

const deleteFile = (filePath) => {
  if (!filePath) return;

  const absolutePath = path.join(process.cwd(), "public", filePath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    console.log("🗑️ Deleted file:", absolutePath);
  } else {
    console.log("⚠️ File not found:", absolutePath);
  }
};

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
      res.redirect("/admin/products-list");
    } else {
      res.status(500).json({ message: "Failed to add product" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  console.log(">>>>>>>>>>>>deletebookFuntionCalled");

  try {
    const productId = req.params.id;
    console.log(productId);

    const db = await connectDB();

    // 1️⃣ Fetch product data to get file paths
    const productData = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(productId) });

    if (!productData) {
      return res.status(404).send("Product not found");
    }

    // 2️⃣ Delete thumbnail
    deleteFile(productData.thumbnail);

    // 3️⃣ Delete product images
    if (Array.isArray(productData.images)) {
      productData.images.forEach((imgPath) => {
        deleteFile(imgPath);
      });
    }
    // 4️⃣ Delete product record from DB
    await db
      .collection(collection.PRODUCTS_COLLECTION)
      .deleteOne({ _id: new ObjectId(productId) });

    res.redirect("/admin/products-list");
  } catch (error) {
    console.log("Delete product error:", error);
    res.status(500).send("Failed to delete the perfume.");
  }
};

export const editProduct = async (req, res) => {
  console.log("edit product function called >>>>>>");
  console.log("Body:", req.body);
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

    const editedProduct = {
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
      updatedAt: new Date(),
    };
    const db = await connectDB();
    const result = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: editedProduct });

    res.redirect("/admin/products-list");
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to edit the product.");
  }
};

export const getProductsData = async (options = {}) => {
  try {
    const db = await connectDB();

    // Build filter dynamically
    const filter = {};
    if (options.category) filter.category = options.category;
    if (options.brand) filter.brand = options.brand;

    let products;

    // Random products
    if (options.sort === "random") {
      products = await db
        .collection(collection.PRODUCTS_COLLECTION)
        .aggregate([
          { $match: filter },
          { $sample: { size: options.limit || 20 } }
        ])
        .toArray();
    } else {
      // Sorting
      let sortOption = { createdAt: -1 };
      if (options.sort === "oldest") sortOption = { createdAt: 1 };

      let query = db
        .collection(collection.PRODUCTS_COLLECTION)
        .find(filter)
        .sort(sortOption);

      if (options.limit) {
        query = query.limit(Number(options.limit));
      }

      products = await query.toArray();
    }

    return products;
  } catch (error) {
    console.error("❌ Error in getProductsData:", error);
    throw error;
  }
};
