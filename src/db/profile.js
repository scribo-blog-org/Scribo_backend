const User = require('../models/User')
const { getPostByQuery } = require('./posts')
const { getUserByQuery } = require('./users.db')
const { Types } = require("mongoose")

async function addPostToSaved(user_id, post_id) {
    const user = await getUserByQuery({ "_id": user_id }, { with_saved_posts: true })

    if(!user.status) return user

    const post = await getPostByQuery({ "_id": post_id })

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

async function removePostFromSaved(user_id, post_id) {
    const user = await getUserByQuery({ "_id": user_id }, { with_saved_posts: true })

    if(!user.status) return user

    const post = await getPostByQuery({ "_id": post_id })

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

async function readNotificationsByUserId(user_id) {
    const user = await getUserByQuery({ "_id": user_id })

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

async function addNotificationToUserById(user_id, notification) {
    if(!notification || !notification.type || (notification.type != "follow" && notification.type != "unfollow") ) {
        throw new Error(`Incorrect type of notification!\nnotification: ${JSON.stringify(notification, null, 2)}`)
    }
    let user = await getUserByQuery({ "_id": user_id })
    
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

async function updateProfileById(user_id, update_fields) {
    const user = await getUserByQuery({ "_id": user_id })
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
    addPostToSaved,
    removePostFromSaved,
    readNotificationsByUserId,
    addNotificationToUserById,
    updateProfileById
}