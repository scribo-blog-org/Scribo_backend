const {Schema, model} = require('mongoose');

let schema = new Schema({
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
})

module.exports = model('EmailVerificationCode', schema, "email_verification_codes");