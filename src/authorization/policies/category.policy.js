const { getCategoryById } = require('../../db/category');
const ForbiddenError  = require('../../errors/ForbiddenError');
const hasPermissions = require('../hasPermissions');
const PERMISSIONS = require('../permissions');

const NotFoundError = require('../../errors/NotFoundError');

const canCreate = async (req, res, next) => {
    try {
        if(hasPermissions(req.profile, PERMISSIONS.CREATE_CATEGORY)) { return next() }

        throw new ForbiddenError("You don't have permission to create a category");

    } catch (error) {
        next(error);
    }
}

const canEdit = async (req, res, next) => {
    try {
        if(hasPermissions(req.profile, PERMISSIONS.EDIT_ANY_CATEGORY)) { return next() }

        throw new ForbiddenError("You don't have permission to edit a category");

    } catch (error) {
        next(error);
    }
}

const canDelete = async (req, res, next) => {
    try {
        if(hasPermissions(req.profile, PERMISSIONS.DELETE_ANY_CATEGORY)) { return next() }

        throw new ForbiddenError("You don't have permission to delete a category");
    } catch (error) {
        next(error);
    }
}

module.exports = {
    canCreate,
    canEdit,
    canDelete
}