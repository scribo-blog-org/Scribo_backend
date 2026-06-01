const { updateProfile } = require('../../services/profile.services')

const updateProfileController = async(req, res, next) => {
    try {
        const nullableFields = ['description'];
        const mandatoryFields = ['nick_name', 'is_email_public', 'is_saved_posts_public'];

        const data = {};

        for (const key in req.body) {
            const value = req.body[key];

            if (nullableFields.includes(key)) {
                data[key] = value; 
            } 
            else if (mandatoryFields.includes(key) && value !== '' && value != null) {
                data[key] = value;
            }
        }

        if(Object.keys(req.body).includes("avatar") || req.file) {
            data['avatar'] = req.file
        }

        if (data.is_email_public !== undefined) {
            data.is_email_public = String(data.is_email_public).toLowerCase() === 'true';
        }
        if (data.is_saved_posts_public !== undefined) {
            data.is_saved_posts_public = String(data.is_saved_posts_public).toLowerCase() === 'true';
        }
        const result = await updateProfile(req.profile, data)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = updateProfileController