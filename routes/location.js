const express = require("express");
const   Locationdb = require("../controller/location");

const LocationRouter = express.Router();

LocationRouter
.post("/", Locationdb.postLocation)
.get("/",  Locationdb.getLocation)
.delete('/:Id',Locationdb.deleteLocation)
.put('/:Id',Locationdb.updateLocation)


exports.LocationRouter = LocationRouter;
