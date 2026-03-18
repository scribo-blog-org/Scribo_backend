const AWS = require('aws-sdk');
const path = require('path');
const url = require('url');

const UPLOAD_LIMIT_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];

process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

AWS.config.update({
    accessKeyId: process.env.AWS_CONNECT_ACCESS_KEY,
    secretAccessKey: process.env.AWS_CONNECT_SECRET_ACCESS_KEY,
    region: process.env.AWS_CONNECT_REGION,
});

const s3 = new AWS.S3();

async function aws_configure() {
    try {
        await s3.headBucket({ Bucket: process.env.AWS_CONNECT_BUCKET_NAME }).promise();
        console.log(`Success configured aws, bucket: ${process.env.AWS_CONNECT_BUCKET_NAME}`);
    } catch (err) {
        global.Logger.log({
            type: "error",
            message: "Error to configure aws",
            data: { 
                error: err
            }
        });
        throw err
    }
}

function image_validation(img) {
    const errors = [];

    if (!ALLOWED_MIME_TYPES.includes(img.mimetype)) {
        errors.push('Incorrect file type, only images (jpeg, png, gif, webp) are allowed!');
    }

    if (img.size > UPLOAD_LIMIT_SIZE) {
        errors.push(`Max size of image should be ${UPLOAD_LIMIT_SIZE / 1024 / 1024} MB!`);
    }

    return errors;
}

async function uploadImage(file, type, file_name) {
    if (!file) {
        return {
            status: false,
            message: "Missing file",
            data: null,
        };
    }

    const errors = image_validation(file);

    if (type !== "avatar" && type !== "featured_image") {
        errors.push('Incorrect type, should be "avatar" or "featured_image".');
    }

    if (!file_name || typeof file_name !== 'string') {
        errors.push('Invalid or missing file_name.');
    }

    if (errors.length > 0) {
        return {
            status: false,
            message: "Validation errors",
            errors,
        };
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const key = `src/${type}/${file_name}${fileExtension}`;

    try {
        const params = {
            Bucket: process.env.AWS_CONNECT_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const result = await s3.putObject(params).promise();

        if (result.ETag) {
            return {
                status: true,
                message: "Successfully uploaded",
                data: {
                    url: `https://${process.env.AWS_CONNECT_BUCKET_NAME}.s3.${process.env.AWS_CONNECT_REGION}.amazonaws.com/${key}`,
                },
            };
        } else {
            return {
                status: false,
                message: "Failed upload",
                data: result,
            };
        }
    } catch (e) {
        global.Logger.log({
            type: "error",
            message: "Error to upload image to aws!",
            data: { 
                file: file,
                type: type,
                file_name: file_name,
                error: e
            }
        });

        throw e
    }
}

async function delete_file(url_file) {
    try {
        const parsedUrl = url.parse(url_file);
        const key = decodeURIComponent(parsedUrl.pathname).slice(1);
        
        const params = {
            Bucket: process.env.AWS_CONNECT_BUCKET_NAME,
            Key: key
        }

        await s3.deleteObject(params).promise();

        return true;

    } catch (error) {
        console.error('Failed to delete file:', error);
        return false;
    }
}

module.exports = {
    uploadImage,
    aws_configure,
    delete_file
};
