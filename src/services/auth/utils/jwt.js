const jwt = require("jsonwebtoken")

function set_jwt_token(user_id) {
    const key = process.env.JWTKEY

    return jwt.sign(
        { user_id: user_id },
        key,
        {}
    )
}

function get_jwt_token(token) {
    const key = process.env.JWTKEY
    try {
        const decoded = jwt.verify(token, key);
        
        if (decoded && decoded.user_id) {
            return {
                status: true,
                message: "",
                data: decoded.user_id
            };
        }

        else {
            return {
                status: false,
                message: "Invalid token",
                data: null
            };
        }
    }
    catch (err) {
        return {
            status: false,
            message: err.message,
            data: null
        };
    }
}

module.exports = {
    get_jwt_token,
    set_jwt_token
}