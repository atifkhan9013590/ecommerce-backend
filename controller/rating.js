// routes.js
const Rating = require("../model/rating");
const Product = require("../model/product");

const getProductWithReviews = async (productId) => {
  return await Product.findById(productId).populate({
    path: 'reviews',
    model: 'Rating',
    select: 'email rating comment timestamp',
  });
};

exports.createReview = async (req, res) => {
  try {
    const { productId, email, rating, comment } = req.body;

    console.log('Received review data:', req.body);

    if (!productId || !email || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Update the product model with the new review details
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { $push: { reviews: { email, rating, comment } } },
      { new: true }
    );

    console.log('Product model updated with new review:', updatedProduct);

    // Fetch the updated product with reviews (now includes the details of each review)
    const productWithReviews = await getProductWithReviews(productId);

    console.log('Product with reviews:', productWithReviews);

    res.status(201).json(productWithReviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Fetch the product with all reviews
    const productWithAllReviews = await getProductWithReviews(productId);

    res.status(200).json(productWithAllReviews.reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};