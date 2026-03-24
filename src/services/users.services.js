const { getUserByQuery, followToUserById, unfollowToUserById , getUsersByQuery } = require('../db/users.db')
const { addNotificationToUserById } = require('../db/profile')
const AppError = require('../errors/AppError')
const NotFoundError = require('../errors/NotFoundError')
const ConflictError = require('../errors/ConflictError')

async function getUserByNickName(nickName){
    if(!nickName) {
        throw new AppError({ message: "Nick name is required" })
    }

    const user = await getUserByQuery({ "nick_name": nickName })

    if(!user.status) {
        throw new NotFoundError({ message: "User not found" })
    }

    return {
        status: true,
        message: "User found",
        data: user.data
    }
}

async function getUsers(params){
    if(!params) {
        throw new AppError({ message: "Query parameters are required" })
    }

    const users = await getUsersByQuery(params)
    
    if(!users.status) {
        throw new NotFoundError({ message: "Users not found" })
    }

    return {
        status: true,
        message: "Users found",
        data: users.data
    }
}

async function follow(userId, profile) {
    if(!userId || !profile) {
        throw new AppError({ message: "User id and profile are required" })
    }

    let followed_user = await getUserByQuery({ "_id": userId })
    if(!followed_user.status) {
        throw new NotFoundError({ message: "User not found" })
    }
    
    if(profile.follows.some(item => item._id.equals(followed_user.data._id))) {
        throw new ConflictError({ message: "You are already following this user!" })
    }

    if(profile._id.equals(followed_user.data._id)) {
        throw new ConflictError({ message: "You cannot follow yourself!" })
    }

    await addNotificationToUserById(followed_user.data._id, { type: "follow", user: profile._id })
    
    const follow = await followToUserById(profile._id, followed_user.data._id)

    global.Logger.log({
        type: "follow",
        message: `User ${follow.data.follower.nick_name} followed ${follow.data.followed.nick_name}`,
        data: {
            follower: follow.data.follower._id,
            followed: follow.data.followed._id
        }
    })

    return {
        status: true,
        message: "Success followed",
        data: {
            follower: {
                id: follow.data.follower._id,
                nick_name: follow.data.follower.nick_name,
                follows: follow.data.follower.follows,
                followers: follow.data.follower.followers,
            },
            followed: {
                id: follow.data.followed._id,
                nick_name: follow.data.followed.nick_name,
                follows: follow.data.followed.follows,
                followers: follow.data.followed.followers
            }  
        }
    }
}

async function unfollow(userId, profile) {
    if(!userId || !profile) {
        throw new AppError({ message: "User id and profile are required" })
    }

    let followed_user = await getUserByQuery({ "_id": userId })

    if(!followed_user.status) {
        throw new NotFoundError({ message: "User not found" })
    }
    
    if(profile._id.equals(followed_user.data._id)) {
        throw new ConflictError({ message: "You cannot unfollow yourself!" })
    }

    if(!profile.follows.some(item => item._id.equals(followed_user.data._id))) {
        throw new ConflictError({ message: "You are not following this user!" })
    }

    await addNotificationToUserById(followed_user.data._id, { type: "unfollow", user: profile._id })

    const follow = await unfollowToUserById(profile._id, followed_user.data._id)

    global.Logger.log({
        type: "unfollow",
        message: `User ${follow.data.follower.nick_name} unfollowed ${follow.data.followed.nick_name}`,
        data: {
            follower: follow.data.follower._id,
            followed: follow.data.followed._id
        }
    })

    return {
        status: true,
        message: "Success unfollowed",
        data: {
            follower: {
                id: follow.data.follower._id,
                nick_name: follow.data.follower.nick_name,
                follows: follow.data.follower.follows,
                followers: follow.data.follower.followers,
            },
            followed: {
                id: follow.data.followed._id,
                nick_name: follow.data.followed.nick_name,
                follows: follow.data.followed.follows,
                followers: follow.data.followed.followers
            }  
        }
    }
}

module.exports = {
    getUsers,
    getUserByNickName,
    follow,
    unfollow
}