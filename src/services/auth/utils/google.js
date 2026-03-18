const AppError = require("../../../errors/AppError");

async function getEmailByGoogleToken(google_token) {
    if(!google_token) throw new AppError("Google token is required for this operation")

    const google_result = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
            headers: {
                Authorization: `Bearer ${google_token}`
            }
        }
    );

    if(google_result.status === 401) { 
        return {
            status: false,
            email: null
        }
    }

    const userEmail = (await google_result.json()).email

    return {
        status: true,
        email: userEmail
    }
}

module.exports = {
    getEmailByGoogleToken
}