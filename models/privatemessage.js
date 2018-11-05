const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PrivateMessageSchema = new Schema({
    content: String,
    sender: {type: mongoose.Schema.Types.ObjectId, ref:'User'},
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    senderName: { type: String},
    receiverName: String,
    userImage: String,
    isRead: { type: Boolean, default: false},
    createdAt: { type:Date, default: Date.now}
});

module.exports = mongoose.model('PrivateMessage', PrivateMessageSchema);