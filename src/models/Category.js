const {Schema, model} = require('mongoose');

let schema = new Schema({
    name: { type: String, required: true },
    icon: { type: Number, default: null },
    color: { type: Number, default: null },
})

module.exports = model('Category', schema);