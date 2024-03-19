const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderNotificationSchema = new Schema({
    status: { type: String, enum: ['read', 'unread'], default: 'unread' },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const OrderNotification = mongoose.model('OrderNotification', orderNotificationSchema);

module.exports = OrderNotification;
