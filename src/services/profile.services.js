const { get_jwt_token } = require('./auth/utils/jwt')
const { getUserByQuery } = require('../db/users.db')
const { readNotificationsByUserId, updateProfileById } = require('../db/profile')
const { deleteFile, uploadImage } = require('./aws.services');
const UnAuthorizedError = require('../errors/UnAuthorizedError');
const ConflictError = require('../errors/ConflictError')

async function getProfile(id) {
    const user = await getUserByQuery({ '_id': id }, { with_saved_posts: true, with_notifications: true })

    if(!user.status) {
        throw new UnAuthorizedError()
    }

    return {
        status: true,
        message: "Success authorized",
        data: user.data
    }
}

async function updateProfile(profile, data) {
    if(data.nick_name) {
        const nick_owner  = await getUserByQuery({ nick_name: data.nick_name })
        
        if(nick_owner.status && nick_owner.data._id !== String(profile._id)) {
            throw new ConflictError({ message: "Nick name is already used by another user!" })
        }
    }
    if(Object.keys(data).includes("avatar")) {
        if(profile.avatar) {
            await deleteFile(profile.avatar)
        }

        if(data.avatar !== undefined && data.avatar !== null) { 
            const upload_image_result = await uploadImage(data.avatar, "avatar", String(profile._id))
            data.avatar = upload_image_result.data.url
        }
        else {
            data.avatar = null
        }
    }
    const result = await updateProfileById(profile._id, data)
    
    global.Logger.log({
        type: "update_profile",
        message: `User ${profile.nick_name} updated their profile`,
        data: {
            user: profile._id,
            updates: data
        }
    })

    return {
        status: true,
        message: "Success updated profile",
        data: result.data
    }
}

async function readNotifications(profile) {
    const user = await getUserByQuery({ '_id': profile._id }, { with_notifications: true })
    
    if(!user.status) {
        throw new UnAuthorizedError()
    }

    const result = await readNotificationsByUserId(profile._id)

    return {
        status: true,
        message: "Success readed all notifications",
        data: { 
            notifications: result.data.notifications
        }
    }
}     

async function getAuthProfile(token) {
    const user_id = get_jwt_token(token).data
    const user = await getUserByQuery({ '_id': user_id })

    if(!user.status) {
        throw new UnAuthorizedError()
    }

    return {
        status: true,
        message: "Success authorized",
        data: user.data
    }
}

module.exports = {
    getProfile,
    updateProfile,
    readNotifications,
    getAuthProfile
}