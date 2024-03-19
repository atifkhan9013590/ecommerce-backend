const express= require('express');
const Ratingdb = require('../controller/rating.js') 
const RatingRouter=express.Router();

RatingRouter
.post('/',Ratingdb.createReview)
.get('/:itemId',Ratingdb.getAllReviews)


exports.RatingRouter=RatingRouter;