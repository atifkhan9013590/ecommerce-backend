const OrderNotification = require('../model/notification.js');

exports.getNotifications = async (req, res) => {
  try {
    // Fetch all notifications
    const notifications = await OrderNotification.find().sort({ createdAt: -1 });

    // Calculate total number of notifications
    const totalDoc = notifications.length;

    // Calculate number of unread notifications
    const totalUnreadDoc = notifications.filter(notification => notification.status === 'unread').length;

    return res.status(200).json({
      totalDoc,
      totalUnreadDoc,
      notifications
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


exports.markAllNotificationsAsRead = async (req, res) => {
    try {
      // Update the status of all notifications to "read"
      await OrderNotification.updateMany({}, { $set: { status: 'read' } });
  
      // Fetch all notifications after updating
      const notifications = await OrderNotification.find().sort({ createdAt: -1 });
  
      // Calculate the total number of notifications
      const totalDoc = notifications.length;
  
      // Since all notifications are marked as read, set totalUnreadDoc to 0
      const totalUnreadDoc = 0;
  
      return res.status(200).json({
        totalDoc,
        totalUnreadDoc,
        notifications
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };

  exports.deleteNotificationById = async (req, res) => {
    try {
      const notificationId = req.params.id;
  
      // Check if the notification exists
      const notification = await OrderNotification.findById(notificationId);
  
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
  
      // Delete the notification
      await OrderNotification.findByIdAndDelete(notificationId);
  
      return res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };