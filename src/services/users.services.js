const User = require('../models/User')
const { get_user_by_query, get_users_by_query, follow_to_user_by_id, unfollow_to_user_by_id } = require('../db/users.db')
const { add_notification_to_user_by_id } = require('../db/profile')
const { get_profile } = require('./profile.services')

async function get_user(req){
    const validation = await field_validation([ { type: "nick_name", value: req.params.nick_name, source: "params" } ])

    if(!validation.status) {
        return {
            status: false,
            message: "Some errors in your fields",
            data: null,
            errors: validation.errors,
            code: 400
        }
    }

    const user = await get_user_by_query({ "nick_name": req.params.nick_name })

    return { ...user, code: user.status ? 200 : 404 }
}

async function get_users(req){
    const params = req.query;

    const fields = Object.keys(params).flatMap(key => {
        const value = params[key];

        if (Array.isArray(value)) {
            return value.map(v => ({
                type: key,
                value: v,
                source: "params"
            }));
            }
        return [{
            type: key,
            value,
            source: "params"
        }];
    });

    const validation = await field_validation(fields)

    if(!validation.status) {
        return {
            status: false,
            message: "Some errors in your fields",
            data: null,
            errors: validation.errors,
            code: 400
        }
    }

    const users = await get_users_by_query(params)
    
    return { ...users, code: users.status ? 200 : 404 }
}

async function follow(req) {
    const id = req.params["id"]
    const token = req?.headers?.authorization?.split(' ')?.[1]
    fields = [
        {
            type: "token",
            value: token,
            source: "Authorization"
        },
        {
            type: "id",
            value: id,
            source: "params"
        },
    ]
    
    const validation = await field_validation(fields)

    if(!validation.status) {
        return {
            status: false, 
            message: "Some errors in your fields!",
            data: null,
            errors: validation.errors,
            code: validation.errors["Authorization"] ? 401 : 400
        }
    }
    
    let profile = await get_profile(req)

    if(!profile.status) return profile

    let followed_user = await get_user_by_query({ "_id": id })

    if(!followed_user.status) {
        return {
            ...followed_user,
            code: 404
        }
    }
    
    if(profile.data.follows.some(item => item._id.equals(followed_user.data._id))) {
        return {
            status: false,
            message: "You are already following this user!",
            data: null,
            code: 409
        }
    }

    if(profile.data._id.equals(followed_user.data._id)) {
        return {
            status: false,
            message: "You cannot follow yourself!",
            data: null,
            code: 409
        }
    }

    const notification = await add_notification_to_user_by_id(followed_user.data._id, { type: "follow", user: profile.data._id })
    
    const follow = await follow_to_user_by_id(profile.data._id, followed_user.data._id)

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
        },
        code: 200
    }
}

async function unfollow(req) {
    const id = req.params["id"]
    const token = req?.headers?.authorization?.split(' ')?.[1]
    
    fields = [
        {
            type: "token",
            value: token,
            source: "Authorization"
        },
        {
            type: "id",
            value: id,
            source: "params"
        },
    ]
    
    const validation = await field_validation(fields)

    if(!validation.status) {
        return {
            status: false, 
            message: "Some errors in your fields!",
            data: null,
            errors: validation.errors,
            code: 401
        }
    }
    
    let profile = await get_profile(req)

    if(!profile.status) return profile

    let followed_user = await get_user_by_query({ "_id": id })

    if(!followed_user.status) {
        return {
            ...followed_user,
            code: 404
        }
    }
    
    if(profile.data._id.equals(followed_user.data._id)) {
        return {
            status: false,
            message: "You cannot unfollow yourself!",
            data: null,
            code: 409
        }
    }

    if(!profile.data.follows.some(item => item._id.equals(followed_user.data._id))) {
        return {
            status: false,
            message: "You are not following this user!",
            data: null,
            code: 409
        }
    }

    const notification = await add_notification_to_user_by_id(followed_user.data._id, { type: "unfollow", user: profile.data._id })

    const follow = await unfollow_to_user_by_id(profile.data._id, followed_user.data._id)

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
        },
        code: 200
    }
}

module.exports = {
    get_users,
    get_user,
    follow,
    unfollow
}