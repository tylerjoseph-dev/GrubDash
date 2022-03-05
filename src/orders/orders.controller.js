const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Must include a ${
        propertyName === "dishes" ? "dish" : propertyName
      }`,
    });
  };
}

function dishesQuantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    let message = "";
    dishes.forEach((dish,index) => {
        
        if(dish.quantity <= 0 || typeof dish.quantity !== 'number'){
            message += `Dish ${index} must have a quantity that is an integer greater than 0\n`
        }
    })
    if(message){
        return next({status:400, message});
    }
    next();
  }
}

function bodyHasDishes(req,res,next){
    const { data: { dishes } = {} } = req.body;
    if(!dishes){
        return next({
            status:400,
            message: `Order must include a dish`
        })
    } else if(dishes.length === 0 || !Array.isArray(dishes)){
        return next({
            status: 400,
            message: `Order must include at least one dish`
        })
    }
    next();
}

function orderStatusIsValid(req, res, next) {
  const {data: {status} = {}} = req.body;
  const acceptableStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
  if(!acceptableStatuses.includes(status)){
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  next();
}

function orderCanBeDeleted(req, res, next){
  const dish = res.locals.order.status;
  if(dish === "delivered"){
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next();
}

function validIdCheck(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id && orderId !== id) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;

  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order not found with id: ${orderId}`,
  });
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newDish = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const order = res.locals.order;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes; //This may need to be changed.

  res.json({ data: order });
}

function checkIfCanDelete(req, res, next){
  const order = res.locals.order;
  if(!(order.status !== "pending")){
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  })
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id == orderId);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
  list,

  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyHasDishes,
    dishesQuantityIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    validIdCheck,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyHasDishes,
    dishesQuantityIsValid,
    orderStatusIsValid,
    update,
  ],
  delete: [
    orderExists,
    checkIfCanDelete,
    destroy,
  ]
};
