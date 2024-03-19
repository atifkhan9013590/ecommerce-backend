const express= require('express');
const Userdb = require('../controller/user.js') 
const UserRouter=express.Router();
const authMiddleware=require('../middleware/authMiddleware.js')


UserRouter.post("/signup", Userdb.signUp)
  .get("/signup", Userdb.getAllRegisterUser)
  .post("/login", Userdb.login)
  .get("/login/:email", Userdb.getUserEmail)
  .post("/addCart", authMiddleware.authMiddleware, Userdb.AddToCart)
  .get("/cart", authMiddleware.authMiddleware, Userdb.getCart)
  .delete("/cart/:itemId", authMiddleware.authMiddleware, Userdb.deleteCartItem)
  .delete(
    "deleteAll/cart",
    authMiddleware.authMiddleware,
    Userdb.deleteAllCartItems
  )

  .get("/profile", authMiddleware.authMiddleware, Userdb.getUserProfile)

  .post("/forgot-password", Userdb.forgotPassword)
  .post("/reset-password", Userdb.resetPassword)
  .post("/verify-otp", Userdb.verifyOTP)
  .delete("/orders/:orderId", authMiddleware.authMiddleware, Userdb.deleteOrder)
  .get(
    "/cartUpdate/:productId",
    authMiddleware.authMiddleware,
    Userdb.UserCartFind
  )

  .get(
    "/user-details-and-coupon",
    authMiddleware.authMiddleware,
    Userdb.getUserDetailsAndCoupon
  )
  .put(
    "/cart/increase/:itemId",
    authMiddleware.authMiddleware,
    Userdb.IncreaseQuantity
  )
  .put(
    "/cart/decrease/:itemId",
    authMiddleware.authMiddleware,
    Userdb.DecreaseQuantity
  )
  .post("/VerifyEmail", Userdb.VerifyEmail)
  .get(
    "/recommendProducts",
    authMiddleware.authMiddleware,
    Userdb.recommendProducts
  )
  .post("/verify-code", Userdb.VerifyCode)
  .post("/wishlist/add", authMiddleware.authMiddleware, Userdb.addToWishlist)
  .delete(
    "/wishlist/delete/:itemId",
    authMiddleware.authMiddleware,
    Userdb.deleteFromWishlist
  )
  .get("/wishlist",authMiddleware.authMiddleware,Userdb.getWishlist);
  


exports.UserRouter=UserRouter;