const { getCommentById } = require('../../db/comments');
const ForbiddenError  = require('../../errors/ForbiddenError');
const hasPermissions = require('../hasPermissions');
const PERMISSIONS = require('../permissions');

const NotFoundError = require('../../errors/NotFoundError');

const canDelete = async (req, res, next) => {
    try {
        const comment = await getCommentById(req.params.id);
        
        if(!comment.status) { throw new NotFoundError(comment.message) }

        if(comment.data.author.toString() === req.profile._id.toString()) { return next() }

        if(hasPermissions(req.profile, PERMISSIONS.DELETE_ANY_COMMENT)) { return next() }

        throw new ForbiddenError("You don't have permission to delete this comment");
    } catch (error) {
        next(error);
    }
};

exports = module.exports = {
    canDelete
}