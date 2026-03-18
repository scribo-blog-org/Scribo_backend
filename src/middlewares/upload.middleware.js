const multer = require('multer');
const path = require('path');
const BadRequestError = require('../errors/BadRequestError');

const storage = multer.memoryStorage();

const fileFilter = (allowedFields = []) => (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    if (!allowedExts.includes(ext)) {
        return cb(new BadRequestError(`File type not allowed: ${ext}`));
    }

    if (allowedFields.length && !allowedFields.includes(file.fieldname)) {
        return cb(new BadRequestError(`Unexpected file field: ${file.fieldname}`));
    }

    cb(null, true);
};

const limits = {
    fileSize: 5 * 1024 * 1024
};

function uploadMiddleware(fields = []) {
    const uploader = multer({ storage, fileFilter: fileFilter(fields), limits });

    if (fields.length === 1) {
        return (req, res, next) => {
            uploader.single(fields[0])(req, res, (err) => {
                if (err) return next(err);
                    next();
                }
            );
        };
    }
    
    else if (fields.length > 1) {
        const multerFields = fields.map(f => ({ name: f, maxCount: 1 }));
        return (req, res, next) => {
            uploader.fields(multerFields)(req, res, (err) => {
                if (err) return next(err);
                    next();
                }
            );
        };
    }

    throw new Error('Upload middleware requires at least one field');
}

module.exports = uploadMiddleware;
