import { bannerData, fragranceTypesData, brandsData } from "../data/index.js";

export const landingPage = async (req, res) => {
  console.log("🚀 landingPage function called");
  try {
    res.render("user/homePage", {
      title: "Home - Royal Essence",
      banners: bannerData,
      brands: brandsData,
      fragranceTypes: fragranceTypesData,
    });
  } catch (error) {
    // console.error("❌ Landing page error:", error);
    res.status(500).send("Error loading home page");
  }
};
