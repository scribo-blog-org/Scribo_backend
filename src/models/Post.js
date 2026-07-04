const {Schema, model, Types} = require('mongoose');

let schema = new Schema({
    author: {type: Types.ObjectId, ref: "User", required: true},
    title: {type: String, required: true},
    featured_image: {type: String, required: false},
    content_text: {type: String, required: true},
    category: {type: String, required: true},
    created_date: {type: Date, required: true, default: Date.now},
    likes: [{type: Types.ObjectId, ref: "User", required: false}],
    comments: [{
        author: {type: Types.ObjectId, ref: "User", required: true},
        content_text: {type: String, required: true},
        date_time: {type: Date, required: true, default: Date.now},
    }]
})

module.exports = model('Post', schema);