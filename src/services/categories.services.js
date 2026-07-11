const { getAllCategories, getCategoryById, updateCategoryById, createNewCategory, deleteCategoryById, getCategoryByName } = require('../db/category')
const { getPostsByQuery } = require('../db/posts')

const AppError = require("../errors/AppError")
const ConflictError = require("../errors/ConflictError")
const NotFoundError = require("../errors/NotFoundError")

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

async function editCategory(id, data, profile) {
    const category = await getCategoryById(id)

    if(!category.status) {
        throw new NotFoundError({ message: "Category not found!" })
    }

    const is_name_exists = await getCategoryByName(data.name)

    if(is_name_exists.status && is_name_exists.data._id.toString() !== id.toString()) {
        throw new ConflictError({ message: "Category name already exists!" })
    }

    let result = await updateCategoryById(id, data)

    if(result.status) {
        const posts = await getPostsByQuery({ category: id })
        result.data.posts_count = posts.status ? posts.data.length : 0
    }

    global.Logger.log({
        type: "update_category",
        message: `User ${profile.nick_name} updated category`,
        data: {
            user: profile._id,
            category: result.data._id
        }
    })

    return result
}

async function createCategory(data, profile) {
    if(!data.name) {
        throw new AppError({ message: "Name is required!" })
    }

    const is_name_exists = await getCategoryByName(data.name)

    if(is_name_exists.status) {
        throw new ConflictError({ message: "Category name already exists!" })
    }

    const result = await createNewCategory(data.name, data.icon, data.color)
    
    if(result.status) {
        global.Logger.log({
            type: "create_category",
            message: `User ${profile.nick_name} created category`,
            data: {
                user: profile._id,
                category: result.data._id
            }
        })

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

async function deleteCategory(id, profile) {
    if(!id) {
        throw new AppError({ message: "Category ID is required!" })
    }

    const category = await getCategoryById(id)

    if(!category.status) {
        throw new NotFoundError({ message: "Category not found!" })
    }

    const posts = await getPostsByQuery({ category: id })

    if(posts.status && posts.data.length > 0) {
        throw new ConflictError({ message: "Cannot delete category with associated posts!" })
    }

    const result = await deleteCategoryById(id)

    if(result.status) {
        global.Logger.log({
            type: "delete_category",
            message: `User ${profile.nick_name} deleted category`,
            data: {
                user: profile._id,
                category: id
            }
        })

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