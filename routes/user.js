const express= require('express');
const Userdb = require('../controller/user.js') 
const UserRouter=express.Router();
const authMiddleware=require('../middleware/authMiddleware.js')


UserRouter.post("/signup", Userdb.signUp)
  .post("/verify", Userdb.verifyOTPS)
  .post("/Resend", Userdb.resendOTP)
  .get("/signup", Userdb.getAllRegisterUser)
  .post("/login", Userdb.login)
  .get("/login/:email", Userdb.getUserEmail)
  .post("/addCart", authMiddleware.authMiddleware, Userdb.AddToCart)
  .get("/cart", authMiddleware.authMiddleware, Userdb.getCart)
  .delete("/cart/:itemId", authMiddleware.authMiddleware, Userdb.deleteCartItem)
  .post("/deleteSelectedUsers", Userdb.deleteSelectedUsers)

  .get("/profile", authMiddleware.authMiddleware, Userdb.getUserProfile)
  .post("/DeleteUser", Userdb.deleteUser)
  .post("/forgot-password", Userdb.forgotPassword)
  .post("/ResenduserOtp", Userdb.resendOTPS)
  .post("/reset-password", Userdb.resetPassword)
  .post("/verify-otp", Userdb.verifyOTP)
  .delete("/orders/:orderId", authMiddleware.authMiddleware, Userdb.deleteOrder)
  .get(
    "/cartUpdate/:productId",
    authMiddleware.authMiddleware,
    Userdb.UserCartFind
  )
  .post("/orderHistory", Userdb.getUserOrderHistory)
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
    "/wishlist/delete/:productId",
    authMiddleware.authMiddleware,
    Userdb.removeFromWishlist
  )
  .get("/wishlist", authMiddleware.authMiddleware, Userdb.getWishlist)
  .post("/change-password", Userdb.changePassword)
  .delete(
    "/deleteAll",
    authMiddleware.authMiddleware,
    Userdb.deleteAllCartItems
  )
  .post("/orderHistory/:userId", Userdb.getUserOrderHistory)
  .post("/address", authMiddleware.authMiddleware, Userdb.postUserAddress)
  .get("/address", authMiddleware.authMiddleware, Userdb.getUserAddresses)
  .delete(
    "/address/:addressId",
    authMiddleware.authMiddleware,
    Userdb.deleteUserAddress
  )
  .put(
    "/address/:addressId",
    authMiddleware.authMiddleware,
    Userdb.updateUserAddress
  )
  .delete('/allorderHistory',authMiddleware.authMiddleware,Userdb.deleteUserOrderHistory)
  

  


exports.UserRouter=UserRouter;