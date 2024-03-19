const model = require("../model/product");
const Product = model;

exports.InventoryPercentageByCategory = async (req, res) => {
    try {
        // Group products by category and calculate total stock for each category
        const productsByCategory = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    totalStock: { $sum: '$stockQuantity' },
                    totalCount: { $sum: 1 } // Count total number of products in each category
                }
            }
        ]);

        // Calculate inventory percentage for each category
        const inventoryPercentageByCategory = productsByCategory.map(category => {
            const percentage = Math.round((category.totalStock / (category.totalCount * 10)) * 100);
            return {
                category: category._id,
                inventoryPercentage: percentage > 100 ? 100 : percentage // Cap percentage at 100%
            };
        });

        res.json(inventoryPercentageByCategory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to calculate inventory percentage' });
    }
};
