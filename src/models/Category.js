const {Schema, model} = require('mongoose');

let schema = new Schema({
    name: { type: String, required: true },
    icon: { type: Number, required: true },
    color: { type: Number, required: true }
})

module.exports = model('Category', schema);