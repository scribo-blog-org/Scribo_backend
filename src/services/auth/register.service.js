const ConflictError = require("../../errors/ConflictError")
const AppError = require("../../errors/AppError")
const BadRequestError = require("../../errors/BadRequestError")
const UnAuthorizedError = require("../../errors/UnAuthorizedError")

const { uploadImage } = require(".././aws.services")
const { setPasswordHash } = require("./utils/password")
const { getEmailByGoogleToken } = require("./utils/google")
const { verifyEmailCode, invalidateVerificationCode } = require("./utils/email")

const { create } = require('../../db/auth.db')
const { getUserByQuery } = require('../../db/users.db')

async function registerByGoogle(
    nickName,
    description,
    password,
    avatar,
    google_token
) {
    if(!google_token) {
        throw new AppError("Google token is required for this operation")
    }

    const result = await getEmailByGoogleToken(google_token)

    if(!result.status) { 
        throw new BadRequestError("Google token is invalid or expired")
    }

    return await register(nickName, description, password, avatar, result.email)
}

async function registerByEmail(
    nickName,
    description,
    password,
    avatar,
    email,
    email_code
) {
    if(!email || !email_code) {
        throw new AppError("Email and email code are required for this operation")
    }

    const result = await verifyEmailCode(email, email_code)

    if(!result) {
        throw new UnAuthorizedError("Invalid email or code")
    }

    const delete_result = await invalidateVerificationCode(email)

    if(!delete_result.status) {
        throw new AppError("Failed to delete verification code")
    }

    return await register(nickName, description, password, avatar, email)
}

async function register(
    nickName,
    description,
    password,
    avatar,
    email
){

    if(!nickName || !password || !email) {
        throw new AppError("Missing some data for register");
    }

    if((await getUserByQuery({ "email": email })).status) {
        throw new ConflictError("User with this email is exists")
    }

    if((await getUserByQuery({ "nick_name": nickName })).status) {
        throw new ConflictError("User with this nick name is exists")
    }

    let upload_image_result

    if(avatar) {
        upload_image_result = await uploadImage(avatar, "avatar", nickName)

        if(!upload_image_result.status) {
            throw new AppError("Error to upload avatar image")
        }
    }
    
    const img = upload_image_result ? upload_image_result.data.url : null

    let newUser = await create({
        nick_name: nickName,
        password: setPasswordHash(password),
        description: description,
        avatar: img,
        email: email
    })

    delete newUser.data.password

    global.Logger.log({
        type: "register",
        message: `User ${newUser.data.nick_name} has registered`
    })

    return {
        status: true,
        message: "Success registered",
        data: newUser.data
    }
}

module.exports = {
    registerByGoogle,
    registerByEmail
}