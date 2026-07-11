const { getPostById } = require('../../services/posts.services');
const ForbiddenError  = require('../../errors/ForbiddenError');
const hasPermissions = require('../hasPermissions');
const PERMISSIONS = require('../permissions');

const NotFoundError = require('../../errors/NotFoundError');

const canCreate = async (req, res, next) => {
    try {
        if(hasPermissions(req.profile, PERMISSIONS.CREATE_POST)) { return next() }

        throw new ForbiddenError("You don't have permission to create a post");

    } catch (error) {
        next(error);
    }
}

const canEdit = async (req, res, next) => {
    try {
        const post = await getPostById(req.params.id);
        
        if(!post.status) { throw new NotFoundError(post.message) }

        if(post.data.author.toString() === req.profile._id.toString()) { return next() }

        if(hasPermissions(req.profile, PERMISSIONS.EDIT_ANY_POST)) { return next() }

        throw new ForbiddenError("You don't have permission to update a post");
    } catch (error) {
        next(error);
    }
}

const canDelete = async (req, res, next) => {
    try {
        const post = await getPostById(req.params.id);
        
        if(!post.status) { throw new NotFoundError(post.message) }

        if(post.data.author.toString() === req.profile._id.toString()) { return next() }

        if(hasPermissions(req.profile, PERMISSIONS.DELETE_ANY_POST)) { return next() }

        throw new ForbiddenError("You don't have permission to delete a post");
    } catch (error) {
        next(error);
    }
}

module.exports = {
    canCreate,
    canEdit,
    canDelete
}