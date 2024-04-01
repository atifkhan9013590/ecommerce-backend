const model = require("../model/location");
const Location = model;


exports.postLocation =async(req,res)=>{
    const location = new Location({
      Address: req.body.Address,
    });

    try {
      const newLocation = await location.save();
      res.status(201).json(newLocation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }

}

exports.getLocation = async (req,res)=>{
 try {
   const locations = await Location.find();
   res.json(locations);
 } catch (error) {
   res.status(500).json({ message: error.message });
 }
}

exports.deleteLocation = async (req,res)=>{
    try {
      const deletedLocation = await Location.findByIdAndDelete(req.params.id);
      if (!deletedLocation) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json({ message: "Location deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }

}