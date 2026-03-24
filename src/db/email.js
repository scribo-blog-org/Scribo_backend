const EmailVerificationCode = require("../models/email")

async function getVerificationCode(email) {
    if(!email) {
        throw new AppError({ message: "Missing email!" })
    }

    const result = await EmailVerificationCode.findOne({ email: email })

    if(result) {
        return {
            status: true,
            message: "Success",
            data: result
        }
    }
    return {
        status: false,
        message: "Verification code not found!",
        data: null
    }
}

async function createVerificationCode(email, code) {
    if(!code) {
        return {
            status: false,
            message: "Missing code!",
            data: null
        }
    }
    if(!email) {
        return {
            status: false,
            message: "Missing email!",
            data: null
        }
    }

    const result = await EmailVerificationCode.findOneAndUpdate(
        { email: email },
        {
            code: code,
            createdAt: new Date()
        },
        {
            upsert: true,
            new: true
        }
    );

    return {
        status: true,
        message: "Success created verification code",
        data: result
    }
}

async function deleteVerificationCode(email) {
    if(!email) {
        return {
            status: false,
            message: "Missing email!",
            data: null
        }
    }

    const deleted = await EmailVerificationCode.findOneAndDelete({ email: email });

    if(deleted) {
        return {
            status: true,
            message: "Success deleted verification code",
            data: deleted
        }
    }
    
    return {
        status: false,
        message: "Verification code not found!",
        data: null
    }
}

module.exports = {
    createVerificationCode,
    deleteVerificationCode,
    getVerificationCode
}