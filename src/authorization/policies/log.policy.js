const ForbiddenError  = require('../../errors/ForbiddenError');
const hasPermissions = require('../hasPermissions');
const PERMISSIONS = require('../permissions');


const canView = async (req, res, next) => {
    try {
        if(hasPermissions(req.profile, PERMISSIONS.VIEW_LOGS)) { return next() }

        throw new ForbiddenError("You don't have permission to view logs");

    } catch (error) {
        next(error);
    }
}

module.exports = {
    canView
}