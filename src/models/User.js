const {Schema, model, Types} = require('mongoose');

const ROLES = require("../authorization/roles");

let schema = new Schema({
    nick_name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String, required: false },
    avatar: { type: String, required: false },
    created_date: { type: Date, required: true, default: Date.now },
    is_admin: { type: Boolean, required: true, default: false },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER,
        required: true
    },
    is_verified: { type: Boolean, required: true, default: false },
    is_email_public: { type: Boolean, required: true, default: true },
    is_saved_posts_public: { type: Boolean, required: true, default: true },
    saved_posts: [
        {
            type: Types.ObjectId,
            ref: "Post",
            required: false
        }
    ],
    follows: [
        {
            type: Types.ObjectId,
            ref: "User",
            required: false,
        }
    ],
    followers: [
        {
            type: Types.ObjectId,
            ref: "User",
            required: false,
        }
    ],
    notifications: [
        {
            is_read: { type: Boolean, required: true, default: false },
            time: { type: Date, required: true, default: Date.now },
            type: { type: String },
            user: { type: Types.ObjectId, ref: "User", required: false },
            post: { type: Types.ObjectId, ref: "Post", required: false },
            comment: { type: Types.ObjectId, ref: "PostComment", required: false }
        }
    ]
})

module.exports = model('User', schema);