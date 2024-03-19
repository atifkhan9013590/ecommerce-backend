const model = require("../model/product");
const Product = model;


async function checkStockAndSendWarning() {
    try {
      // Find products with stock quantity less than 8
      const lowStockProducts = await Product.find({ stockQuantity: { $lt: 8 } });
  
      if (lowStockProducts.length > 0) {
        // Prepare warning message
        const warningMessage = lowStockProducts.map(product => `${product.description}: ${product.stockQuantity}`).join('\n');
        console.log("Warning: Low stock for the following products:\n", warningMessage);
  
        // Return low stock products along with the message
        return { message: 'Low stock checked successfully', lowStockProducts };
      } else {
        // If no low stock products found
        return { message: 'No low stock products found' };
      }
    } catch (error) {
      console.error('Error checking stock quantity:', error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  }
  
  exports.showStockQuantity = async (req, res) => {
    try {
      const response = await checkStockAndSendWarning();
      res.status(200).json(response);
    } catch (error) {
      console.error('Error checking low stock:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }