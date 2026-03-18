async function defaultRoute() {
    const apiUrl = process.env.API_DOCUMENTATION_ORIGIN;
    if (!apiUrl) {
        return "Server is working, use /api for fetches"
    }
    
    const response = await fetch(apiUrl);
    
    if (response.status === 200) {
        return `<p>Server is working\nYou can check api documentation here: </p><a href="${apiUrl}" target="_blank">Api Documentation</a>`
    }

    return "Server is working, use /api for fetches"
}

module.exports = {
    defaultRoute
}