const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const Router = require("./routes/product.js");
const UserRouter = require("./routes/user.js");
const RatingRouter = require("./routes/rating.js");
const OrderRouter = require("./routes/order.js");
const CouponRouter = require("./routes/coupon.js");
const adminRouter = require("./routes/admin.js");
const CategoryRouter = require("./routes/category.js");
const BannerRouter = require("./routes/banner.js");
const StockRouter = require("./routes/stock.js");
const inventoryRouter = require("./routes/inventory.js");
const AnnouncementRouter = require("./routes/announcement.js");
const notificationRouter = require("./routes/notification.js");
const SearchRouter = require("./routes/search.js");
const FilterRouter = require("./routes/filter.js");
const ProductSearchRouter = require("./routes/productsearch.js");
const LocationRouter = require("./routes/location.js");
const ShippingRouter = require("./routes/shipping");
const NotifyRouter =require('./routes/productNotification.js');
const PricedropsRouter =require('./routes/pricedrop')
require("dotenv").config();

const OrderStatusRouter = require("./routes/orderstatus.js");

// Connect to local MongoDB using MongoDB Compass URL
const DB = process.env.DB_URL;

async function main() {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}
main();

// Body parser config
const bodyParserConfig = {
  limit: "50mb", // Set a value appropriate for your use case
};
app.use(bodyParser.json(bodyParserConfig));
app.use(bodyParser.urlencoded({ extended: true, ...bodyParserConfig }));

// Enable CORS middleware
app.use(cors());

// Routes
app.use("/admin", adminRouter.adminRouter);
app.use("/products", Router.ProductRouter);
app.use("/category", CategoryRouter.CategoryRouter);
app.use("/filter", FilterRouter.FilterRouter);
app.use("/stock", StockRouter.StockRouter);
app.use("/Banner", BannerRouter.BannerRouter);
app.use("/location", LocationRouter.LocationRouter);
app.use("/shipping", ShippingRouter.ShippingRouter);
app.use("/inventory", inventoryRouter.inventoryRouter);
app.use("/Prd", ProductSearchRouter.ProductSearchRouter);
app.use("/status", OrderStatusRouter.OrderStatusRouter);
app.use("/user", UserRouter.UserRouter);
app.use("/Rating", RatingRouter.RatingRouter);
app.use("/Order", OrderRouter.OrderRouter); // Call OrderRouter as a function with io parameter
app.use("/coupon", CouponRouter.CouponRouter);
app.use("/announcements", AnnouncementRouter.AnnouncementRouter);
app.use("/notification", notificationRouter.notificationRouter);
app.use("/search", SearchRouter.SearchRouter);
app.use("/notifyme", NotifyRouter.NotifyRouter);
app.use("/pricedrops", PricedropsRouter.PricedropsRouter);

// Server setup
const PORT = 8000;
const server = http.createServer(app).listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
