class Schema {
    constructor() {
        this.fields = [];
    }

    required(type, options = {}) {
        return this.add(type, { ...options, optional: false });
    }

    optional(type, options = {}) {
        return this.add(type, { ...options, optional: true });
    }

    add(type, options = {}) {
        const {
            source = 'body',
            optional = false,
            ...rest
        } = options;

        this.fields.push({
            type,
            source,
            optional,
            ...rest
        });

        return this;
    }

    build() {
        return this.fields;
    }
}

const loginUsernameSchema = new Schema()
    .required('user_name')
    .required('password')
    .build();

const loginGoogleSchema = new Schema()
    .required('google_token')
    .build();

const registerEmailSchema = new Schema()
    .required('email')
    .required('password')
    .required('nick_name')
    .required('email_code')
    .optional('description')
    .build();

const registerGoogleSchema = new Schema()
    .required('google_token')
    .required('password')
    .required('nick_name')
    .optional('description')
    .build();

const verificationGoogleSchema = new Schema()
    .required('google_token')
    .build();

const verificationEmailSchema = new Schema()
    .required('email')
    .build();

const verificationEmailConfirmSchema = new Schema()
    .required('email')
    .required('email_code')
    .build();

const getPostByIdSchema = new Schema()
    .required('id', { source: 'params' })
    .optional('expand', { source: 'query' })
    .build();

const createPostSchema = new Schema()
    .required('title')
    .required('content_text')
    .required('category')
    .optional('feature_image')
    .build();

const deletePostSchema = new Schema()
    .required('id', { source: 'params' })
    .build();

module.exports = {
    loginUsernameSchema,
    loginGoogleSchema,
    registerEmailSchema,
    registerGoogleSchema,
    verificationGoogleSchema,
    verificationEmailSchema,
    verificationEmailConfirmSchema,
    getPostByIdSchema,
    createPostSchema,
    deletePostSchema
}