const User = require('../models/User')

async function getUsersByQuery(query = {}, options = { with_password: false, with_saved_posts: false, with_notifications: false }) {
    let users = await User.find(query)

    if(users.length === 0) {
        return {
            status: false,
            message: 'Users not found',
            data: null
        }
    }

    users = users.map(user => {
        const userObj = user.toObject();

        if (!options.with_password) {
            delete userObj.password;
        }

        if (!options.with_saved_posts) {
            delete userObj.saved_posts;
        }

        if (!options.with_notifications) {
            delete userObj.notifications;
        }

        return userObj;
    })

    return {
        status: true,
        message: 'Success',
        data: users
    }
}

async function getUserByQuery(query = {}, options = { with_password: false, with_saved_posts: false, with_notifications: false }) {
    let user = await User.findOne(query)

    if(!user) {
        return {
            status: false,
            message: 'User not found',
            data: null
        }
    }

    const userObj = user.toObject();

    if(!options.with_password) delete userObj.password
    if(!options.with_saved_posts) delete userObj.saved_posts
    if(!options.with_notifications) delete userObj.notifications

    return {
        status: true,
        message: 'Success',
        data: userObj
    }
}

async function follow_to_user_by_id(follower_id, followed_id) {
    const follower = await User.findOneAndUpdate(
        { _id: follower_id },
        {
            $push: {
                follows: followed_id
            }
        },
        { new: true }
    );
    if(!follower) {
        return {
            status: false,
            message: "Follower not found",
            data: null
        }
    }
    const followed = await User.findOneAndUpdate(
        { _id: followed_id },
        {
            $push: {
                followers: follower_id
            }
        },
        { new: true }
    );
    if(!followed) {
        return {
            status: false,
            message: "Followed not found",
            data: null
        }
    }

    return {
        status: true,
        message: "Success followed",
        data: {
            follower: follower,
            followed: followed
        }
    }
}

async function unfollow_to_user_by_id(follower_id, followed_id) {
    const follower = await User.findOneAndUpdate(
        { _id: follower_id },
        {
            $pull: {
                follows: followed_id
            }
        },
        { new: true }
    );
    if(!follower) {
        return {
            status: false,
            message: "Follower not found!",
            data: null
        }
    }
    const followed = await User.findOneAndUpdate(
        { _id: followed_id },
        {
            $pull: {
                followers: follower_id
            }
        },
        { new: true }
    );

    if(!followed) {
        return {
            status: false,
            message: "Followed not found",
            data: null
        }
    }

    return {
        status: true,
        message: "Success",
        data: {
            follower: follower,
            followed: followed
        }
    }
}

async function remove_post_from_saved(user_id, post_id) {
    const new_user = await User.findOneAndUpdate(
        { _id: user_id },
        { $pull: { saved_posts: new ObjectId(post_id) } },
        { new: true }
    );
    if(!new_user) {
        return {
            status: false,
            message: "User not found!",
            data: null
        }
    }

    return {
        status: true,
        message: "Success removed post from saved",
        data: new_user
    }
}

module.exports = {
    getUsersByQuery,
    getUserByQuery,
    follow_to_user_by_id,
    unfollow_to_user_by_id,
    remove_post_from_saved
}