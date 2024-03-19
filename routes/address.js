const express = require("express");
const addressdb = require("../controller/address.js");
const AddressRouter = express.Router();

AddressRouter
.post('',addressdb.postAddress)
.get('',addressdb.getAddress)

exports.AddressRouter=AddressRouter;