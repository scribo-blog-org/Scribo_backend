const { getAuthProfile, getProfile } = require('../services/profile.services')
const UnauthorizedError = require('../errors/UnAuthorizedError')

const authMiddleware = async (req, res, next) => {
    try { 
        const authHeader = req.headers.authorization;
    
        if (!authHeader) {
            return next(new UnauthorizedError());
        }
    
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return next(new UnauthorizedError());
        }
    
        const profile = await getAuthProfile(token)
        
        if (!profile.status) {
            return next(new UnauthorizedError());
        }
        
        req.profile = (await getProfile(profile.data._id)).data;

        next();
    }
    catch(error) {
        next(error)
    }
};

module.exports = authMiddleware;