const {Schema, model, Types} = require('mongoose');

let schema = new Schema({
    author: { type: Types.ObjectId, required: true, ref: "User" },
    comment_text: { type: String, required: true },
    post_id: { type: Types.ObjectId, required: false, ref: "Post" },
    created_date: { type: Date, required: true, default: Date.now },
    parent_comment_id: { type: Types.ObjectId, ref: "post_comments", default: null }
})

module.exports = model('post_comments', schema);