const { check } = require('express-validator')
const models = require('../../models')
const Product = models.Product
const Order = models.Order
const Restaurant = models.Restaurant

const checkOrderPending = async (value, { req }) => {
  try {
    const order = await Order.findByPk(req.params.orderId,
      {
        attributes: ['startedAt']
      })
    if (order.startedAt) {
      return Promise.reject(new Error('The order has already been started'))
    } else {
      return Promise.resolve('ok')
    }
  } catch (err) {
    return Promise.reject(err)
  }
}
const checkOrderCanBeSent = async (value, { req }) => {
  try {
    const order = await Order.findByPk(req.params.orderId,
      {
        attributes: ['startedAt', 'sentAt']
      })
    if (!order.startedAt) {
      return Promise.reject(new Error('The order is not started'))
    } else if (order.sentAt) {
      return Promise.reject(new Error('The order has already been sent'))
    } else {
      return Promise.resolve('ok')
    }
  } catch (err) {
    return Promise.reject(err)
  }
}
const checkOrderCanBeDelivered = async (value, { req }) => {
  try {
    const order = await Order.findByPk(req.params.orderId,
      {
        attributes: ['startedAt', 'sentAt', 'deliveredAt']
      })
    if (!order.startedAt) {
      return Promise.reject(new Error('The order is not started'))
    } else if (!order.sentAt) {
      return Promise.reject(new Error('The order is not sent'))
    } else if (order.deliveredAt) {
      return Promise.reject(new Error('The order has already been delivered'))
    } else {
      return Promise.resolve('ok')
    }
  } catch (err) {
    return Promise.reject(err)
  }
}

const checkProductsAvailable = async (value, { req }) => {
  try {
    for (const product of value) {
      const p = await Product.findByPk(product.productId)
      if (p.availability === false) {
        return Promise.reject(new Error('The product is not available'))
      }
    }
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(new Error('checkProductsAvailable err'))
  }
}

const checkProductsBelongSameRestaurant = async (value, { req }) => {
  try {
    const product1 = await Product.findByPk(value[0].productId)
    for (const product of value) {
      const product2 = await Product.findByPk(product.productId)
      if (product2.restaurantId !== product1.restaurantId) {
        return Promise.reject(new Error('The products belong to different restaurants'))
      }
    }
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(new Error('checkProductsBelongSameRestaurant err'))
  }
}

const checkOrderNotEmpty = async (value, { req }) => {
  try {
    for (const product of value) {
      if (product.quantity === 0 || value.length <= 0 || product.productId < 1) {
        return Promise.reject(new Error('The order is empty or the products inside it do not exist.'))
      }
    }
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(new Error('checkOrderNotEmpty err'))
  }
}

const checkRestaurantExists = async (value, { req }) => {
  try {
    const restaurant = await Restaurant.findByPk(req.body.restaurantId)
    if (restaurant === null) {
      return Promise.reject(new Error('The restaurantId does not exist.'))
    } else { return Promise.resolve() }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

module.exports = {
  // TODO: Include validation rules for create that should:
  // 1. Check that restaurantId is present in the body and corresponds to an existing restaurant
  // 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
  // 3. Check that products are available
  // 4. Check that all the products belong to the same restaurant
  create: [
    check('restaurantId').exists().isInt({ min: 1 }).toInt(),
    check('restaurantId').custom(checkRestaurantExists),
    check('products').custom(checkOrderNotEmpty),
    check('products')
      .custom(async (value, { req }) => {
        // Check that productsIds are valid (they exists in the database), and every product belongs to the restaurant of the order.
        const products = req.body.products
        const res = true
        for (const product of products) {
          const productDB = await models.Product.findByPk(product.productId)
          if (!productDB) {
            res = false
          } else if (productDB.restaurantId !== req.body.restaurantId) {
            res = false
          }
        }
        return res
      }).withMessage('El producto no existe en la base de datos o pertenece a otro restaurante'),
    check('products').custom(checkProductsAvailable)

  ],
  // TODO: Include validation rules for update that should:
  // 1. Check that restaurantId is NOT present in the body.
  // 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
  // 3. Check that products are available
  // 4. Check that all the products belong to the same restaurant of the originally saved order that is being edited.
  // 5. Check that the order is in the 'pending' state.

  // REVISAR
  update: [

    check('restaurantId').not().exists(),
    check('products').custom(checkOrderNotEmpty),
    check('products').custom(checkProductsBelongSameRestaurant),
    check('products').custom(checkProductsAvailable),
    check('startedAt').custom(checkOrderPending)
  ],
  // TODO: Include validation rules for destroying an order that should check if the order is in the 'pending' state
  destroy: [

    check('startedAt').custom(checkOrderPending)

  ],
  confirm: [
    check('startedAt').custom(checkOrderPending)
  ],
  send: [
    check('sentAt').custom(checkOrderCanBeSent)
  ],
  deliver: [
    check('deliveredAt').custom(checkOrderCanBeDelivered)
  ]
}
