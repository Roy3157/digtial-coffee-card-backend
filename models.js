const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: false,
    }
});

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = { Notification}