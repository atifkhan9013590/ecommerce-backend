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

exports.deleteShipping =async (req,res)=>{
const { id } = req.params;

try {
  const deletedShipping = await Shipping.findByIdAndDelete(id);
  if (!deletedShipping) {
    return res.status(404).json({ message: "Shipping policy not found" });
  }
  res.json({ message: "Shipping policy deleted successfully" });
} catch (error) {
  res.status(500).json({ message: error.message });
}
}