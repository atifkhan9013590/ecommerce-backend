const model = require("../model/shipping");
const Shipping = model;


exports.postShippping =async (req,res)=>{
 const { ShippingPolicy } = req.body;

 try {
   const newShipping = new Shipping({ ShippingPolicy });
   await newShipping.save();
   res.status(201).json(newShipping);
 } catch (error) {
   res.status(400).json({ message: error.message });
 }
}

exports.getShipping =async (req,res) =>{
try {
  const shippingPolicies = await Shipping.find();
  res.json(shippingPolicies);
} catch (error) {
  res.status(500).json({ message: error.message });
}
}

exports.deleteShipping = async (req, res) => {
  const { Id } = req.params;
  console.log("ID received from frontend:", Id); // Log the ID received from frontend

  try {
    const deletedShipping = await Shipping.findByIdAndDelete(Id);
    if (!deletedShipping) {
      return res.status(404).json({ message: "Shipping policy not found" });
    }
    res.json({ message: "Shipping policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateShipping = async (req, res) => {
  const { Id } = req.params; // Use uppercase "Id" to match the parameter in the route
  const { ShippingPolicy } = req.body;
  console.log("REQBODY", req.body);
  console.log("ID", Id); // Ensure that "Id" is correctly logged
  try {
    // Use findByIdAndUpdate to update the shipping policy by ID
    const updatedShipping = await Shipping.findByIdAndUpdate(
      Id, // Use "Id" instead of "id"
      { ShippingPolicy },
      { new: true }
    );

    if (!updatedShipping) {
      return res.status(404).json({ message: "Shipping policy not found" });
    }

    res.json(updatedShipping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
