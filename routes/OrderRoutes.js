'use strict'
const OrderController = require('../controllers/OrderController')
const OrderValidation = require('../controllers/validation/OrderValidation')
const Order = require('../models').Order
const fs = require('fs')

const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(process.env.RESTAURANTS_FOLDER, { recursive: true })
    cb(null, process.env.RESTAURANTS_FOLDER)
  },
  filename: function (req, file, cb) {
    cb(null, Math.random().toString(36).substring(7) + '-' + Date.now() + '.' + file.originalname.split('.').pop())
  }
})

const upload = multer({ storage }).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'heroImage', maxCount: 1 }
])

module.exports = (options) => {
  const app = options.app
  const middlewares = options.middlewares

  // TODO: Include routes for:
  // 1. Retrieving orders from current logged-in customer
  app.route('/orders')
    .get(
      middlewares.isLoggedIn,
      middlewares.hasRole('customer'),
      OrderController.indexCustomer
    )
  // 2. Creating a new order (only customers can create new orders)
    .post(
      middlewares.isLoggedIn,
      middlewares.hasRole('customer'),
      upload,
      OrderValidation.create,
      middlewares.handleValidation,
      OrderController.create
    )
  app.route('/orders/:orderId')
    .get(
      middlewares.isLoggedIn,
      middlewares.checkEntityExists(Order, 'orderId'),
      middlewares.checkOrderVisible,
      OrderController.show)
  // TODO: Include routes for:
  // 3. Editing order (only customers can edit their own orders)
    .put( // Editar pedidos
      middlewares.isLoggedIn,
      middlewares.hasRole('customer'),
      middlewares.checkEntityExists(Order, 'orderId'),
      middlewares.checkOrderCustomer,
      OrderValidation.update,
      middlewares.handleValidation,
      middlewares.checkOrderVisible,
      OrderController.update
    )
  // 4. Remove order (only customers can remove their own orders)
    .delete( // Eliminar pedidos
      middlewares.isLoggedIn,
      middlewares.hasRole('customer'),
      middlewares.checkEntityExists(Order, 'orderId'),
      middlewares.checkOrderCustomer,
      OrderValidation.destroy,
      middlewares.handleValidation,
      OrderController.destroy)

  app.route('/orders/:orderId/confirm')
    .patch(
      middlewares.isLoggedIn,
      middlewares.hasRole('owner'),
      middlewares.checkEntityExists(Order, 'orderId'),
      middlewares.checkOrderOwnership,
      OrderValidation.confirm,
      middlewares.handleValidation,
      OrderController.confirm)

  app.route('/orders/:orderId/send')
    .patch(
      middlewares.isLoggedIn,
      middlewares.hasRole('owner'),
      middlewares.checkEntityExists(Order, 'orderId'),
      middlewares.checkOrderOwnership,
      OrderValidation.send,
      middlewares.handleValidation,
      OrderController.send)

  app.route('/orders/:orderId/deliver')
    .patch(
      middlewares.isLoggedIn,
      middlewares.hasRole('owner'),
      middlewares.checkEntityExists(Order, 'orderId'),
      middlewares.checkOrderOwnership,
      OrderValidation.deliver,
      middlewares.handleValidation,
      OrderController.deliver
    )
}
