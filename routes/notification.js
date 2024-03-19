const express = require ("express");
const notificationController = require("../controller/notification.js");

const notificationRouter = express.Router();


notificationRouter
  .get("/getAll", notificationController.getNotifications)
  .put('/mark-read',notificationController.markAllNotificationsAsRead)
  .delete('/:id', notificationController.deleteNotificationById);
 

exports.notificationRouter = notificationRouter;
