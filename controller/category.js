const model = require("../model/category.js");
const Category = model;

exports.createCategory = async (req, res) => {
  const { category, mainCategoryimg } = req.body;
    console.log("post Request Body", req.body);
  try {
    // Check if category with the same name already exists
    const existingCategory = await Category.findOne({ category });
    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    // If category doesn't exist, create a new one
    const newCategory = new Category({ category, mainCategoryimg });

    // Save the new category
    const savedCategory = await newCategory.save();

    res.status(201).json(savedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
  
exports.getAllCategories = async (req, res) => {
  try {
    // Retrieve all categories from the database
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteCategoryById = async (req, res) => {
  const categoryId = req.params.id;

  try {
    // Find the category by ID and remove it
    const deletedCategory = await Category.findByIdAndRemove(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully", deletedCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateCategoryById = async (req, res) => {
  const categoryId = req.params.id;
  const { category, mainCategoryimg } = req.body;
  console.log("update Request Body", req.body);

  try {
    // Find the category by ID and update its data
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { category, mainCategoryimg },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res
      .status(200)
      .json({ message: "Category updated successfully", updatedCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
