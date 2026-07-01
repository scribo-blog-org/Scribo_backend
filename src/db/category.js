const Category = require("../models/Category")
const AppError = require("../errors/AppError")

async function getAllCategories() {
    const categories = await Category.find()
    if(!categories) {
        return {
            status: false,
            message: "Categories not found",
            data: null
        }
    }

    return {
        status: true,
        message: "Categories found",
        data: categories
    }
}

async function createNewCategory(name, iconUrl=null) {
    if(!name) {
        return {
            status: false,
            message: "Name is required",
            data: null
        }
    }

    const category = new Category({ name: name, icon: iconUrl });
    await category.save();

    return {
        status: true,
        message: "Category created successfully",
        data: category
    }
}

module.exports = {
    getAllCategories,
    createNewCategory
}