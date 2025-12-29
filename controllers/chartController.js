import connectDB from "../config/db.js";
import collection from "../config/collection.js";

// Helper to get last year's sales by category (Men/Women)
export const getCurrentYearSalesByCategory = async () => {
  const db = await connectDB();
  const ordersCollection = db.collection(collection.ORDERS_COLLECTION);
  const productsCollection = db.collection(collection.PRODUCTS_COLLECTION);

  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0); // Jan 1, 00:00:00
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59); // Dec 31, 23:59:59

  console.log("startOfYear >>>>", startOfYear);
  console.log("endOfYear >>>>", endOfYear);

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    { $unwind: "$userCart" },
    {
      $lookup: {
        from: "products",
        localField: "userCart.productId",
        foreignField: "productId",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          category: "$productInfo.category",
        },
        totalQuantity: { $sum: "$userCart.quantity" },
      },
    },
  ];

  const results = await ordersCollection.aggregate(pipeline).toArray();

//   console.log("results>>>>>",results)

  const menData = Array(12).fill(0);
  const womenData = Array(12).fill(0);

  results.forEach((r) => {
    const monthIndex = r._id.month - 1; // $month gives 1-12
    if (r._id.category === "Men") menData[monthIndex] = r.totalQuantity;
    if (r._id.category === "Women") womenData[monthIndex] = r.totalQuantity;
  });

  return { menData, womenData };
};

