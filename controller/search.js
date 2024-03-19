const model = require("../model/product");
const Product = model;



exports.SearchByName = async (req, res) => {
    try {
      const searchTerm = req.params.term;
      console.log("Search term:", searchTerm);
      const products = await Product.find({
        $or: [
          { title: { $regex: new RegExp(searchTerm, "i") } },
          { sku: { $regex: new RegExp(searchTerm, "i") } }
        ]
      });
      console.log(products);
      if (!products || products.length === 0) {
        return res.status(404).json({ error: "Products not found" });
      }
  
      res.status(200).json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to find the products" });
    }
  };