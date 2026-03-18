const NotFoundError = require("../../errors/NotFoundError")
const BadRequestError = require("../../errors/BadRequestError")
const UnAuthorizedError = require("../../errors/UnAuthorizedError")
const AppError = require("../../errors/AppError")
 
const { compare_passwords } = require("./utils/password")
const { getEmailByGoogleToken } = require("./utils/google")
const { set_jwt_token } = require("./utils/jwt")

const { getUserByQuery } = require('../../db/users.db')

async function loginByGoogle(google_token) {
    if(!google_token) {
        throw new AppError("Google token is required for this operation")
    }
    const result = await getEmailByGoogleToken(google_token)

    if(!result.status) {
        throw new BadRequestError("Google token is invalid or expired")
    }

    const user = await getUserByQuery({ email: result.email })

    if(!user.status) 
    {
        throw new NotFoundError("User with this email is not found")
    }

    return {
        status: true,
        message: "Authorized",
        data: {
            token: set_jwt_token(user.data._id)
        }
    }
}

async function loginByUserName(userName, password) {
    if(!userName || !password) {
        throw new AppError("User name and password are required for this operation")
    }
    const user = await getUserByQuery({
        $or: [
            { email: userName },
            { nick_name: userName }
        ]
    }, { with_password: true });

    if(!user.status) {
        throw new NotFoundError("User with this email or nick name is not found")
    }

    if(!await compare_passwords(password, user.data.password)) {
        throw new UnAuthorizedError("Invalid password or user name")
    }

    return {
        status: true,
        message: "Authorized",
        data: {
            token: set_jwt_token(user.data._id)
        }
    }
}

module.exports = {
    loginByGoogle,
    loginByUserName
}