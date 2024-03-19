const model = require("../model/banner.js");
const Banner = model;

exports.createBanner= async (req, res) => {
    const { category, subcategory, bannerimg } = req.body;
    try {
      const BannerData = {
        category,
        subcategory,
        bannerimg,
      };
  
      if (!category || !subcategory ||!bannerimg) {
        return res
          .status(400)
          .json({ error: "Please provide category  sucategory and bannerimg" });
      }
  
      const newBanner = new Banner(BannerData);
  
      const savedBanner= await newBanner.save();
  
      res.status(201).json(savedBanner);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
exports.getAllBanner = async (req, res) => {
  try {
   
    const banner = await Banner.find();
    res.status(200).json(banner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.deleteBannerById = async (req, res) => {
  const bannerId = req.params.id;

  try {
    // Find the category by ID and remove it
    const deletedBanner= await Banner.findByIdAndRemove(bannerId);

    if (!deletedBanner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    res.status(200).json({ message: "Banner deleted successfully", deletedBanner});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.updateBannerById = async (req, res) => {
  const bannerId = req.params.id;
  const {category,subcategory,bannerimg} = req.body;

  try {
    // Find the category by ID and update its data
    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      { category,subcategory,bannerimg },
      { new: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    res.status(200).json({ message: "Banner updated successfully", updatedBanner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};