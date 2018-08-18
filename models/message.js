const mongosse = require('mongoose');
const Schema = mongosse.Schema;

const MessageSchema = new Schema({
    owner:{ type: Schema.Types.ObjectId, ref:'User'},
    content: String,
    created: {type:Date, default: Date.now}
});
module.exports = mongosse.model('Message', MessageSchema);