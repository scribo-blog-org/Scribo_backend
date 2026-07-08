const { getAllCategories, getCategoryById, updateCategoryById, createNewCategory, deleteCategoryById } = require('../db/category')
const { getPostsByQuery } = require('../db/posts')

const AppError = require("../errors/AppError")
const ConflictError = require("../errors/ConflictError")

async function getCategories() {
    const result = await getAllCategories();

    if(result.status === true) {
        for(let category of result.data) {
            const posts = await getPostsByQuery({ category: category._id })
            if(posts.status){
                category.posts_count = posts.data.length
            }
            else {
                category.posts_count = 0
            }
        }
    }

    return {
        status: true,
        message: "Success fetched categories",
        data: result.data
    }
}

async function editCategory(id, data) {
    const category = await getCategoryById(id)

    if(!category.status) {
        throw new NotFoundError({ message: "Category not found!" })
    }

    let result = await updateCategoryById(id, data)

    if(result.status) {
        const posts = await getPostsByQuery({ category: id })
        result.data.posts_count = posts.status ? posts.data.length : 0
    }
    return result
}

async function createCategory(data) {
    if(!data.name || !data.icon || !data.color) {
        throw new AppError({ message: "Name, icon and color are required!" })
    }
    const result = await createNewCategory(data.name, data.icon, data.color)

    if(result.status) {
        return {
            status: true,
            message: "Category created successfully",
            data: result.data
        }
    }
    else {
        return {
            status: false,
            message: result.message,
            data: null
        }
    }
}

async function deleteCategory(id) {
    if(!id) {
        throw new AppError({ message: "Category ID is required!" })
    }

    const posts = await getPostsByQuery({ category: id })

    if(posts.status && posts.data.length > 0) {
        throw new ConflictError({ message: "Cannot delete category with associated posts!" })
    }

    const result = await deleteCategoryById(id)

    if(result.status) {
        return {
            status: true,
            message: "Category deleted successfully",
            data: result.data
        }
    }

    else {
        return {
            status: false,
            message: result.message,
            data: null
        }
    }
}

module.exports = {
    getCategories,
    editCategory,
    createCategory,
    deleteCategory
}