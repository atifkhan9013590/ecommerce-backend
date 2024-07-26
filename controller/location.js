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
   const { Id } = req.params;
    try {
      const deletedLocation = await Location.findByIdAndDelete(Id);
      if (!deletedLocation) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json({ message: "Location deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }

}

exports.updateLocation = async (req, res) => {
  const { Id } = req.params;
  const { Address } = req.body;
console.log('Address',req.body)
  try {
    // Find the location by ID and update it
    const updatedLocation = await Location.findByIdAndUpdate(
      Id,
      { Address },
      { new: true } // Return the updated location
    );

    // Check if the location exists
    if (!updatedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    // Send the updated location as JSON response
    res.json(updatedLocation);
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: error.message });
  }
};
