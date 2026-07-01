const {Schema, model} = require('mongoose');

let schema = new Schema({
    name: { type: String, required: true },
    icon: { type: String, required: false, defaul: null },
})

module.exports = model('Category', schema);