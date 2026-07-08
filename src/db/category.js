const Category = require("../models/Category")
const AppError = require("../errors/AppError")

async function getAllCategories() {
    const categories = await Category.find().lean()
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

async function getCategoryById(id) {
    const category = await Category.findById(id).lean()

    if(!category) {
        return {
            status: false,
            message: "Category not found",
            data: null
        }
    }

    return {
        status: true,
        message: "Category found",
        data: category
    }
}

async function createNewCategory(name, icon, color) {
    if(!name) {
        return {
            status: false,
            message: "Name is required",
            data: null
        }
    }

    const category = new Category({ name: name, icon: icon, color: color });
    await category.save();

    return {
        status: true,
        message: "Category created successfully",
        data: category
    }
}

async function updateCategoryById(id, data) {
    const updated_category = await Category.findByIdAndUpdate(id, data, { new: true }).lean()

    if(!updated_category) {
        return {
            status: false,
            message: "Category not found!",
            data: null
        }
    }

    return {
        status: true,
        message: "Success updated category",
        data: updated_category
    }
}

module.exports = {
    getAllCategories,
    createNewCategory,
    getCategoryById,
    updateCategoryById
}