const { get_jwt_token } = require('../../services/auth/utils/jwt')
const mongoose = require('mongoose');

const BadRequestError = require('../../errors/BadRequestError')

function push_to_errors(errors, source, field) {
    if(!errors[source]) {
        errors[source] = {}
    }
    
    errors[source][field.type] = field.data
    
    return errors
}

function validate(fields) {
    let errors = { }
    if(!fields) {
        return {
            status: true,
            errors: errors
        }
    }

    for(const field of fields) {
        const isBooleanValue = v =>
            v === true ||
            v === false ||
            v === "true" ||
            v === "false" ||
            v === 1 ||
            v === 0 ||
            v === "1" ||
            v === "0";
        switch(field.type){
            case "title":
                if(!field.value || field.value.trim().length === 0) {
                    errors = push_to_errors(errors, field.source, { type: "title", data: { message: "Title must be not empty!", data: field.value }})   
                    break
                }
                if(field.value.length > 120) {
                    errors = push_to_errors(errors, field.source, { type: "title", data: { message: "The title must cannot be less than 120 characters!", data: field.value }})   
                }
                break
            case "content_text":
                if(!field.value || field.value.trim().length === 0) {
                    errors = push_to_errors(errors, field.source, { type: "content_text", data: { message: "Content text must be not empty!", data: field.value }})   
                    break
                }
                if(!field.value.length > 2000) {
                    errors = push_to_errors(errors, field.source, { type: "content_text", data: { message: "Content text cannot be less than 2000 characters!", data: field.value }})   
                }
                break
            case "token":
                if(!field.value || field.value.trim().length === 0) {
                    errors = push_to_errors(errors, field.source, { type: "token", data: { message: "Token is empty!", data: field.value }})
                    break
                }
                try{
                    const token_result = get_jwt_token(field.value)
                    
                    if(!token_result.status) {
                        errors = push_to_errors(errors, field.source, { type: "token", data: { message: "Incorrect token!", data: field.value }})
                        break
                    }
                }
                catch(e) {
                    console.log(e)
                    errors = push_to_errors(errors, field.source, { type: "token", data: { message: "Incorrect token!", data: field.value }})
                }
                break
            case "description":
                if(field.value && field.value.length > 60) {
                    errors = push_to_errors(errors, field.source, { type: "description", data: { message: "Description must be longer than 60 characters!", data: field.value }})
                }
                break
            case "category":
                if(field.value && field.value.length > 60) {
                    errors = push_to_errors(errors, field.source, { type: "category", data: { message: "Post category must be less then 60 characters!", data: field.value }})
                    break
                }
                if(!field.value || field.value.length < 3) {
                    errors = push_to_errors(errors, field.source, { type: "category", data: { message: "The post category must be longer than 3 characters!", data: field.value }})
                }
                break
            case "password":
                if(!field.value || field.value.length < 8) {
                    errors = push_to_errors(errors, field.source, { type: "password", data: { message: "Passowrd must be longer than 7 characters!", data: field.value }})
                    break
                }
                if(field.value.length > 20) {
                    errors = push_to_errors(errors, field.source, { type: "password", data: { message: "Passowrd must be less than 21 characters!", data: field.value }})
                }
                break
            case "nick_name":
                if(!field.value || field.value.length < 3) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Nick name must be longer than 3 characters!", data: field.value }})
                    break
                }
                if(field.value.length > 20) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Nick name must be less than 21 characters!", data: field.value }})
                }
                break
            case "_id":
                if(!field.value || field.value.toString().trim().length === 0) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Id must be not empty!", data: field.value }})
                }
                else {
                    if (!mongoose.Types.ObjectId.isValid(field.value)) {
                        errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Incorrect type!", data: field.value }})
                    }
                }
                break
            case "id":
                if(!field.value || field.value.trim().length === 0) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Id must be not empty!", data: field.value }})
                }
                else {
                    if (!mongoose.Types.ObjectId.isValid(field.value)) {
                        errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Incorrect type!", data: field.value }})
                    }
                }
                break
            case "author":
                if(!field.value || field.value.trim().length === 0) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Id must be not empty!", data: field.value }})
                    break
                }
                if (!mongoose.Types.ObjectId.isValid(field.value)) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Incorrect type!", data: field.value }})
                }
                break
            case "is_verified":
                if(!isBooleanValue(field.value)) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Field is_verified should be boolean!", data: field.value }})
                }
                break
            case "is_admin":
                if(!isBooleanValue(field.value)) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Field is_verified should be boolean!", data: field.value }})
                }
                break
            case "is_email_public":
                if(!isBooleanValue(field.value)) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Field is_email_public should be boolean!", data: field.value }})
                }
                break
            case "email":
                if(!field.value) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Missing email!", data: "" }})
                    break
                }
                if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Incorrect email!", data: field.value }})
                }
                break
            case "email_code":
                if(!field.value) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Missing email code!", data: "" }})
                    break
                }
                if(!/^[0-9]{6}$/.test(field.value)) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Incorrect email code!", data: field.value }})
                }
                break
            case "google_token":
                if(!field.value || field.value.trim().length === 0){
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Missing token!", data: field.value }})
                    break
                }
                if(typeof field.value !== 'string' || field.value.length > 345 || !/^[A-Za-z0-9_.-]+$/.test(field.value.trim())) {
                    errors = push_to_errors(errors, field.source, { type: field.type, data: { message: "Incorrect type of google token!", data: field.value }})
                }
            
        }
    }
    return {
        status: Object.keys(errors).length === 0,
        errors: errors
    }
}

const validateMiddleware = (fields) => {
    return (req, res, next) => {
        const preparedFields = [];

        for (const field of fields) {
            const value = req[field.source]?.[field.field || field.type];

            if (value === undefined || value === null) {
                if (!field.optional) {
                    preparedFields.push({
                    ...field,
                    value
                    });
                }
                continue;
            }

            preparedFields.push({
                ...field,
                value
            });
        }

        const validation = validate(preparedFields);

        if (!validation.status) {
            return next(
                new BadRequestError('Some errors in your fields', validation.errors)
            );
        }

        next();
    };
};

module.exports = validateMiddleware;
