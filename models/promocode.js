const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PromocodeSchema = new Schema({
    name: String,
    discount: Number

});

module.exports = mongoose.model('Promocode', PromocodeSchema);