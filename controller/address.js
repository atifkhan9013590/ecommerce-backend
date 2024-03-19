const model = require("../model/address");
const Address = model;


exports.postAddress =async(req,res)=>{
try {
 
  const {
    email,
    firstName,
    lastName,
    country,
    address,
    city,
    postalCode,
    phoneNumber,
  } = req.body;

 
  const newAddress = new Address({
    email,
    firstName,
    lastName,
    country,
    address,
    city,
    postalCode,
    phoneNumber,
  });

  
  const savedAddress = await newAddress.save();

 
  res.status(201).json(savedAddress);
} catch (error) {
 
  console.error("Error saving address:", error);
  res.status(500).json({ error: "Failed to save address" });
}
}

exports.getAddress = async(req,res)=>{
  try {
    // Fetch all addresses from the database
    const addresses = await Address.find();
    res.status(200).json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
}