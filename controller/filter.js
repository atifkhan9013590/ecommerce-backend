const model = require("../model/product");
const Product = model;

exports.getProductsByPriceRange = async (req, res) => {
  const { minPrice, maxPrice } = req.query;

  try {
    // Convert minPrice and maxPrice to numbers
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);

    // Check if min and max are valid numbers
    if (isNaN(min) || isNaN(max)) {
      return res.status(400).json({ error: "Invalid price range" });
    }

    const filteredProducts = await Product.find({
      price: { $gte: min, $lte: max },
    });
    res.json(filteredProducts);
  } catch (error) {
    console.error("Error filtering products by price range:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getCategoriesWithSubcategories = async (req, res) => {
  try {
    // Aggregate to extract unique categories and their corresponding subcategories
    const categoriesWithSubcategories = await Product.aggregate([
      {
        $group: { _id: { category: "$category", subcategory: "$subcategory" } },
      },
      {
        $group: {
          _id: "$_id.category",
          subcategories: { $addToSet: "$_id.subcategory" },
        },
      },
      {
        $project: {
          category: { $trim: { input: "$_id", chars: '"' } },
          subcategories: {
            $map: {
              input: "$subcategories",
              as: "subcategory",
              in: { $trim: { input: "$$subcategory", chars: '"' } },
            },
          },
        },
      },
      {
        $sort: { category: 1 }, // Sort categories alphabetically
      },
    ]);

    res.json(categoriesWithSubcategories);
  } catch (error) {
    console.error("Error fetching categories with subcategories:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch categories with subcategories" });
  }
};




