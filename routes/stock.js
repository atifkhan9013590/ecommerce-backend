const express=require('express')
const stockDb=require('../controller/stock.js')
const StockRouter=express.Router();


StockRouter
.get('/check-low-stock',stockDb.showStockQuantity)

exports.StockRouter=StockRouter;