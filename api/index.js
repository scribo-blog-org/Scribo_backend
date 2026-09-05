module.exports = async (req, res) => {
    const loaded = require('../dist/vercel.js');
    const handler = loaded.default || loaded;
    return handler(req, res);
};
