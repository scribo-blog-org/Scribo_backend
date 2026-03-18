const User = require('../models/User')
const { get_post_by_query } = require('./posts')
const { get_user_by_query } = require('./users.db')
const { Types } = require("mongoose")

async function add_post_to_saved(user_id, post_id) {
    const user = await get_user_by_query({ "_id": user_id }, { with_saved_posts: true })

    if(!user.status) return user

    const post = await get_post_by_query({ "_id": post_id })

    if(!post.status) return post

    if(user.data.saved_posts.some(p => p.toString() === post_id)) {
        return {
            status: false,
            message: "Post is already in saved posts!",
            data: null
        }
    }

    const result = await User.findOneAndUpdate(
        { _id: user_id },
        { $push: { saved_posts: post_id }},
        { new: true }
    );

    return {
        status: true,
        message: "Success saved post",
        data: result
    }
}

async function remove_post_from_saved(user_id, post_id) {
    const user = await get_user_by_query({ "_id": user_id }, { with_saved_posts: true })

    if(!user.status) return user

    const post = await get_post_by_query({ "_id": post_id })

    if(!post.status) return post

    if(!user.data.saved_posts.some(p => p.toString() === post_id)) {
        return {
            status: false,
            message: "Post is not in saved posts!"
        }
    }

    const result = await User.findOneAndUpdate(
        { _id: user_id },
        { $pull: { saved_posts: post_id }},
        { new: true }
    );

    return {
        status: true,
        message: "Success unsaved post",
        data: result
    }
}

async function read_notifications_by_user_id(user_id) {
    const user = await get_user_by_query({ "_id": user_id })

    if(!user.status) {
        return {
            status: false,
            message: "User not found!",
            data: null
        }
    }

    const new_user = await User.findOneAndUpdate(
        { _id: user.data._id },
        {
            $set: {
                'notifications.$[].is_read': true
            }
        },
        { new: true }
    )

    return {
        status: true,
        message: "Success readed all notifications",
        data: new_user
    }
}

async function add_notification_to_user_by_id(user_id, notification) {
    if(!notification || !notification.type || (notification.type != "follow" && notification.type != "unfollow") ) {
        throw new Error(`Incorrect type of notification!\nnotification: ${JSON.stringify(notification, null, 2)}`)
    }
    let user = await get_user_by_query({ "_id": user_id })
    
    if(!user.status) {
        throw new Error(`Failed to find user!\nuser_id: ${user_id}` )
    }

    const object = {};

    if (notification?.user) {
        object.user = new Types.ObjectId(notification.user);
    }

    if (notification?.post) {
        object.post = new Types.ObjectId(notification.post);
    }

    if (Object.keys(object).length > 0) {
        const updated_user = await User.findOneAndUpdate(
            { _id: user_id },
            {
                $push: {
                    notifications: {
                        type: notification.type,
                        ...object
                    }
                }
            },
            { new: true }
        );

        return {
            status: true,
            message: "Success added notification",
            data: updated_user
        }
    }
}

async function update_profile_by_id(user_id, update_fields) {
    const user = await get_user_by_query({ "_id": user_id })
    if(!user.status) return user

    const result = await User.findOneAndUpdate( 
        { _id: user_id },
        { $set: update_fields },
        { new: true }
    );  
    return {
        status: true,
        message: "Success updated profile",
        data: result
    }
}

module.exports = {
    add_post_to_saved,
    remove_post_from_saved,
    read_notifications_by_user_id,
    add_notification_to_user_by_id,
    update_profile_by_id
}