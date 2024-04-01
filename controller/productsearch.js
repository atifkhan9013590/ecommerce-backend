const model = require("../model/product");
const Product = model;



exports.getProductById = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Return only the _id and stockQuantity
    res.status(200).json({
      _id: product._id,
      stockQuantity: product.stockQuantity,
    });
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};
