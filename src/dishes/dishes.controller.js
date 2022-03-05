const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function bodyDataHas(propertyName){
    return function (req,res,next){
        const {data = {}} = req.body;
        if(data[propertyName]){
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        });
    };
};

function idRouteMatch(req,res,next){
    const {data: {id} = {}} = req.body;
    const {dishId} = req.params;

    if(id){
        if(id !== dishId){
            next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});
        }
    }
    next();
}

function pricePropertyIsValid(req,res,next){
    const {data: {price} = {}} = req.body;

    typeof price === 'number'
    ? price > 0 
        ? next()
        : next({status: 400, message: `Dish must have a price that is an integer greater than 0`})
    : next({status: 400, message: `Dish must have a price that is an integer greater than 0`})
}

function imageUrlPropertyIsValid(req, res, next){
    const {data: {image_url} = {}} = req.body;

    if(image_url){
        return next();
    }
    next({
        status: 400,
        message: `Dish must include a image_url`,
    });
}

function validDataId(req,res,next){
    const {dishId} = req.params;

    dishId === res.locals.dishId
        ? next()
        : next({status: 400})

}









function dishExists(req, res, next){
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(foundDish){
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${req.params.dishId}`,
    });
};


function create(req, res, next){
    const {data: {name, description, price, image_url} = {}} = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish});
};

function read(req, res){
    res.json({data: res.locals.dish});
}

function update(req, res, next){
    const {data: {name, description, price, image_url} = {}} = req.body;

    res.locals.dish.name = name;
    res.locals.dish.description = description;
    res.locals.dish.price = price;
    res.locals.dish.image_url = image_url;
    
    res.json({data: res.locals.dish});

}

function destroy(req, res){
    const {dishId} = req.params;
    const index = dishes.findIndex((dish) => dish.id === dishId);
    if(index < -1){
        dishes.splice(index, 1);
    }
    res.sendStatus(204);
}

function list(req,res){
    res.json({data: dishes});
}

module.exports = {
    list,

    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        bodyDataHas("price"),
        pricePropertyIsValid,
        imageUrlPropertyIsValid,
        create
    ],
    read: [dishExists, read],

    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        bodyDataHas("price"),
        pricePropertyIsValid,
        imageUrlPropertyIsValid,
        idRouteMatch,
        update,
    ],

    delete: [dishExists, destroy],

    dishExists,
}