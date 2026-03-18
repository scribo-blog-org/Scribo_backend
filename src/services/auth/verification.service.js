const AppError = require("../../errors/AppError")
const BadRequestError = require("../../errors/BadRequestError")
const { getEmailByGoogleToken } = require("./utils/google")

async function verifyGoogleToken(google_token) {
    if(!google_token) {
        throw new AppError("Google token is required for this operation")
    }

    const email = await getEmailByGoogleToken(google_token)

    if(!email.status) {
        throw new BadRequestError("Google token is invalid")
    }

    const user = await getUserByQuery({ email: email.email })

    return {
        status: true,
        message: "Google token is valid",
        data: { 
            email: email.email,
            is_registered: user.status
        }
    }
}

async function requestVerificationCode(email) {
    if(!email) {
        throw new AppError("Email is required to send verification code!")
    }
    
    const user = await getUserByQuery({ email: email })

    if(user.status) {
        throw new ConflictError("User with this email is already exists!")
    }

    const result = await sendVerificationCode(email)

    if(result.status) {
        return {
            status: true,
            message: result.message,
            data: null,
            code: 200
        }
    }
}

async function confirmEmailCode(email, email_code) {
    if(!email) {
        throw new AppError("Email is required to confirm verification code!")
    }

    const result = await verifyEmailCode(email, email_code)

    if(!result) {
        throw new BadRequestError("Invalid verification code!")
    }

    return {
        status: true,
        message: "Successfully confirmed email verification code!",
        data: null
    }
}

async function verifyToken(token) {
    
}

module.exports = {
    verifyGoogleToken,
    requestVerificationCode,
    confirmEmailCode
}