const path = require("path");
const fs = require("fs");
const AppError = require('../errors/AppError');

const getDocsJson = () => {
    try {
        const filePath = path.join(__dirname, "./templates/OpenApi.json");
        const openApi = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const backendVersion = packageJson.version;

        openApi.info["x-backend-version"] = backendVersion;

        return openApi;
    } catch (err) {
        throw new AppError({message: err.message});
    }
};

module.exports = getDocsJson;