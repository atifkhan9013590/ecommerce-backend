const model = require("../model/product");
const Product = model;


exports.CreateProduct = async (req, res) => {
  const {
    title,
    description,
    price,
    discountPercentage,
    thumbnail,
    category,
    subcategory,
    image1,
    image2,
    image3,
    quantity,
    stockQuantity,
  } = req.body;

  try {
    // Generate a unique SKU asynchronously
    const sku = await generateUniqueSku();

    const productData = {
      title,
      description,
      price: parseFloat(price) || 0,
      quantity,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      thumbnail,
      category,
      subcategory,
      image1,
      image2,
      image3,
      sku // Include the generated SKU in the product data
    };

    // Check if discountPercentage is provided and is a valid number
    if (discountPercentage !== undefined && discountPercentage !== null && !isNaN(discountPercentage)) {
      productData.discountPercentage = parseFloat(discountPercentage);
    }

    const product = new Product(productData);

    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: "Failed to create product" });
  }
};


async function generateUniqueSku(retries = 5) {
  if (retries === 0) {
    throw new Error('Exceeded maximum retries for generating a unique SKU');
  }

  // Generate a random string for SKU
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sku = '';
  for (let i = 0; i < 8; i++) {
    sku += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Check if the generated SKU already exists
  const existingProduct = await Product.findOne({ sku });
  if (existingProduct) {
    // If the SKU already exists, generate a new one recursively
    return generateUniqueSku(retries - 1);
  }

  // Return the unique SKU
  return sku;
}


exports.updateProduct = async (req, res) => {
  const { productId } = req.params; 

  try {
    // Find the existing product by ID
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

   
    const {
      title,
      description,
      price,
      discountPercentage,
      thumbnail,
      category,
      subcategory,
      image1,
      image2,
      image3,
      quantity,
      stockQuantity,
    } = req.body;

    // Update fields only if they are provided in the request body
    if (title) existingProduct.title = title;
    if (description) existingProduct.description = description;
    if (price) existingProduct.price = parseFloat(price) || 0;
    if (quantity) existingProduct.quantity = quantity;
    if (stockQuantity) existingProduct.stockQuantity = parseInt(stockQuantity, 10) || 0;
    if (thumbnail) existingProduct.thumbnail = thumbnail;
    if (category) existingProduct.category = category;
    if (subcategory) existingProduct.subcategory = subcategory;
    if (image1) existingProduct.image1 = image1;
    if (image2) existingProduct.image2 = image2;
    if (image3) existingProduct.image3 = image3;

    // Check if discountPercentage is provided and is a valid number
    if (discountPercentage !== undefined && discountPercentage !== null && !isNaN(discountPercentage)) {
      existingProduct.discountPercentage = parseFloat(discountPercentage);
    } else {
      // If discountPercentage is not provided, remove it
      existingProduct.discountPercentage = undefined;
    }

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};


exports.getAllProducts = async (req, res) => {
  try {
    const allProducts = await Product.find();
    res.status(200).json(allProducts);
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ error: "Failed to fetch all products" });
  }
};




exports.getproductCategory=async(req,res)=>{
  const { category, subcategory } = req.params;

  try {
    const matchingProducts = await Product.find({ category, subcategory });
    res.json(matchingProducts);
  } catch (error) {
    console.error('Error fetching matching products:', error);
    res.status(500).json({ error: 'Failed to fetch matching products' });
  }
}

exports.SearchById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const category = product.category;

    // Fetch all products with the same category
    const relatedProducts = await Product.find({ category: category });

    // You can exclude the current product if needed
    // const relatedProducts = await Product.find({ category: category, _id: { $ne: id } });

    res.status(200).json({
      product: product,
      relatedProducts: relatedProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to find products" });
  }
};






exports.DeleteProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    await Product.deleteOne({ _id: productId });
    res.json({ message: "One Product Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllProductcategory = async (req, res) => {
  try {
    const category = req.params.category;

    const productsByCategory = await Product.find({ category: category });

    if (productsByCategory.length === 0) {
      return res.status(404).json({ error: "No products found in the specified category" });
    }

    res.status(200).json(productsByCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.IncreaseQuantity = async (req, res) => {
  const productId = req.params.productId;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: { quantity: 1 } },
      { new: true }
    );

    if (updatedProduct) {
      // Successfully updated, respond with the updated product
      res.json({ success: true, product: updatedProduct });
    } else {
      // Product not found
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    // Handle errors
    console.error('Error updating quantity:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
exports.DecreaseQuantity = async (req, res) => {
  const productId = req.params.productId;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, quantity: { $gt: 1 } },
      { $inc: { quantity: -1 } },
      { new: true }
    );

    if (updatedProduct) {
      // Successfully updated, respond with the updated product
      res.json({ success: true, product: updatedProduct });
    } else {
      // Either product not found or quantity is already 1
      res.status(400).json({ success: false, message: 'Cannot decrease quantity further' });
    }
  } catch (error) {
    // Handle errors
    console.error('Error updating quantity:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
exports.StockStatus = async (req, res) => {
  try {
    // Find all products with stockQuantity equal to 0
    const outOfStockProducts = await Product.find({ stockQuantity: 0 });

    // Update stockStatus to 'Out of Stock' for the found products
    await Product.updateMany({ stockQuantity: 0 }, { $set: { stockStatus: 'Out of Stock' } });

    // Create an array to store titles and stockStatus of out-of-stock products
    const outOfStockInfo = outOfStockProducts.map((product) => ({
      title: product.title,
      stockStatus: 'Out of Stock',
    }));

    // Send the array as the API response
    res.status(200).json(outOfStockInfo);
  } catch (error) {
    console.error('Error updating or fetching out-of-stock products:', error);
    res.status(500).json({ error: 'Failed to update or fetch out-of-stock products' });
  }
};

exports.getALLproductsubCategory =async (req,res) => {
  try {
    const subcategory = req.params.subcategory;

    const productsBysubCategory = await Product.find({ subcategory: subcategory });

    if (productsBysubCategory.length === 0) {
      return res.status(404).json({ error: "No products found in the specified category" });
    }

    res.status(200).json(productsBysubCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}


exports.sortAlphabeticallyAZ = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).sort({ description: 1 });
    res.json(products);
  } catch (error) {
    console.error("Error sorting products alphabetically A to Z:", error);
    res.status(500).json({ error: "Failed to sort products" });
  }
};

exports.sortAlphabeticallyZA = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).sort({ description: -1 });
    res.json(products);
  } catch (error) {
    console.error("Error sorting products alphabetically Z to A:", error);
    res.status(500).json({ error: "Failed to sort products" });
  }
};

exports.sortByPriceLow = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).sort({ price: 1 });
    res.json(products);
  } catch (error) {
    console.error("Error sorting products by low price:", error);
    res.status(500).json({ error: "Failed to sort products" });
  }
};

exports.sortByPriceHigh = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).sort({ price: -1 });
    res.json(products);
  } catch (error) {
    console.error("Error sorting products by high price:", error);
    res.status(500).json({ error: "Failed to sort products" });
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
    ]);

    // Format the data as an array of objects with category and subcategories
    const formattedData = categoriesWithSubcategories.map((item) => ({
      category: item._id,
      subcategories: item.subcategories,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching categories with subcategories:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch categories with subcategories" });
  }
};



