const express=require('express')
const inventoryDb=require('../controller/inventory.js')
const inventoryRouter=express.Router();

inventoryRouter
.get('/PercentageByCategory', inventoryDb.InventoryPercentageByCategory)

exports.inventoryRouter=inventoryRouter;