const express= require('express');
const Coupondb = require('../controller/coupon.js') 
const CouponRouter=express.Router();

CouponRouter
.post('/',Coupondb.createCoupon)
.post('/apply',Coupondb.applyCoupon)
.get('/',Coupondb.getCoupon)
.delete('/:id',Coupondb.deleteCouponById)
.get('/:id',Coupondb.getCouponById)
.put('/:id',Coupondb.updateCoupon)

exports.CouponRouter=CouponRouter;