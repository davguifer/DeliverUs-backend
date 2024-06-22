'use strict'
const models = require('../models')
const Order = models.Order
const Product = models.Product
const Restaurant = models.Restaurant
const User = models.User
const RestaurantCategory = models.RestaurantCategory

const moment = require('moment')
const { Op } = require('sequelize')
const { validationResult } = require('express-validator')
// const { sequelize } = require('../models')

const generateFilterWhereClauses = function (req) {
  const filterWhereClauses = []
  if (req.query.status) {
    switch (req.query.status) {
      case 'pending':
        filterWhereClauses.push({
          startedAt: null
        })
        break
      case 'in process':
        filterWhereClauses.push({
          [Op.and]: [
            {
              startedAt: {
                [Op.ne]: null
              }
            },
            { sentAt: null },
            { deliveredAt: null }
          ]
        })
        break
      case 'sent':
        filterWhereClauses.push({
          [Op.and]: [
            {
              sentAt: {
                [Op.ne]: null
              }
            },
            { deliveredAt: null }
          ]
        })
        break
      case 'delivered':
        filterWhereClauses.push({
          sentAt: {
            [Op.ne]: null
          }
        })
        break
    }
  }
  if (req.query.from) {
    const date = moment(req.query.from, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.gte]: date
      }
    })
  }
  if (req.query.to) {
    const date = moment(req.query.to, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.lte]: date.add(1, 'days') // FIXME: se pasa al siguiente día a las 00:00
      }
    })
  }
  return filterWhereClauses
}

// Returns :restaurantId orders
exports.indexRestaurant = async function (req, res) {
  const whereClauses = generateFilterWhereClauses(req)
  whereClauses.push({
    restaurantId: req.params.restaurantId
  })
  try {
    const orders = await Order.findAll({
      where: whereClauses,
      include: {
        model: Product,
        as: 'products'
      }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

// TODO: Implement the indexCustomer function that queries orders from current logged-in customer
// and send them back.
// Orders have to include products that belongs to each order and
// restaurant details sort them by createdAt date, desc.

exports.indexCustomer = async function (req, res) {
  try {
    const orders = await Order.findAll(
      {
        attributes: ['id', 'startedAt', 'sentAt', 'deliveredAt', 'price', 'address', 'shippingCosts', 'restaurantId', 'userId', 'createdAt', 'updatedAt'],
        where: { userId: req.user.id },
        include: [
          {
            model: Restaurant,
            as: 'restaurant',
            attributes: ['id', 'name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId'],
            include: {
              model: RestaurantCategory,
              as: 'restaurantCategory'
            }
          },
          {
            model: Product,
            as: 'products',
            attributes: ['id', 'name', 'price', 'description', 'image', 'restaurantId', 'order', 'availability']
          }
        ],
        order: [['createdAt', 'DESC']]
      })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

// TODO: Implement the create function that receives a new order and stores it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the order and related products, start a transaction, store the order, store each product linea and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction

exports.create = async function (req, res) {
  const validationError = validationResult(req)
  const t = await Order.sequelize.transaction()
  if (validationError.errors.length > 0) {
    return res.status(422).send(validationError)
  }
  try {
    const restaurantId = req.body.restaurantId
    const products = req.body.products
    const productRestaurantIds = await Promise.all(
      products.map(async (prod) => {
        const product = await Product.findByPk(prod.productId)
        return product.restaurantId
      })
    )
    const hasDifferentRestaurants = productRestaurantIds.some(
      (id) => id !== restaurantId
    )
    if (hasDifferentRestaurants) {
      return res.status(422).send('')
    }
    const newOrder = Order.build({ ...req.body, userId: req.user.id, startedAt: null, sentAt: null })
    let cost = 0
    for (const prod of req.body.products) {
      const product = await Product.findByPk(prod.productId)
      const unityPrice = product.price
      const amount = prod.quantity
      const unitPrice = unityPrice * amount
      cost = cost + unitPrice
    }
    if (cost > 10.0) {
      newOrder.shippingCosts = 0.0
      newOrder.price = cost
    } else {
      const restaurant = await Restaurant.findByPk(req.body.restaurantId)
      if (restaurant == null) {
        res.statusz(404).send('Not found restaurant')
      } else {
        newOrder.shippingCosts = restaurant.shippingCosts
        newOrder.price = cost + newOrder.shippingCosts
      }
    }
    const savedOrder = await newOrder.save()
    savedOrder.dataValues.products = []
    for (const prod of req.body.products) {
      const product = await Product.findByPk(prod.productId)
      const unityPrice = product.price
      const amount = prod.quantity
      savedOrder.dataValues.products.push(product)
      await savedOrder.addProduct(product, { through: { quantity: amount, unityPrice } })
    }
    res.json(savedOrder)
    await t.commit()
  } catch (err) {
    await t.rollback()
    if (err.name.includes('ValidationError')) {
      res.status(422).send(err)
    } else {
      res.status(500).send(err)
    }
  }
}

// TODO: Implement the update function that receives a modified order and persists it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the updated order and updated products, start a transaction, update the order, remove the old related OrderProducts and store the new product lines, and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction
exports.update = async function (req, res) {
  const validationError = validationResult(req)
  const t = await Order.sequelize.transaction()
  if (validationError.errors.length > 0) {
    return res.status(422).send(validationError)
  }
  try {
    const order = await Order.findByPk(req.params.orderId)
    if (!order) {
      return res.status(404).send('Order not found')
    }
    const updatedOrder = await order.update(req.body, { transaction: t })
    updatedOrder.dataValues.products = []
    let cost = 0
    for (const prod of req.body.products) {
      const product = await Product.findByPk(prod.productId)
      const unityPrice = product.price
      const amount = prod.quantity
      const unitPrice = unityPrice * amount
      cost = cost + unitPrice
      if (cost > 10.0) {
        updatedOrder.shippingCosts = 0.0
        updatedOrder.price = cost
      } else {
        const restaurant = await Restaurant.findByPk(req.body.restaurantId)
        if (restaurant == null) {
          res.statusz(404).send('Not found restaurante')
        } else {
          updatedOrder.shippingCosts = restaurant.shippingCosts
          updatedOrder.price = cost + updatedOrder.shippingCosts
        }
      }
      updatedOrder.dataValues.products.push({
        id: prod.productId,
        name: product.name,
        OrderProducts: {
          quantity: amount,
          priceUnit: unitPrice
        }
      })
    }

    res.json(updatedOrder)
    await t.commit()
  } catch (err) {
    await t.rollback()
    if (err.name.includes('ValidationError')) {
      res.status(422).send(err)
    } else {
      res.status(500).send(err)
    }
  }
}

// TODO: Implement the destroy function that receives an orderId as path param and removes the associated order from the database.
// Take into account that:
// 1. The migration include the "ON DELETE CASCADE" directive so OrderProducts related to this order will be automatically removed.
exports.destroy = async function (req, res) {
  try {
    const orderId = req.params.orderId
    const result = await Order.destroy({ where: { id: orderId } })
    if (result === 0) {
      return res.status(404).send('Order not found')
    }
    return res.send('Request successfully removed')
  } catch (err) {
    return res.status(500).send(err)
  }
}

exports.confirm = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.startedAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.send = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.sentAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.deliver = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.deliveredAt = new Date()
    const updatedOrder = await order.save()
    const restaurant = await Restaurant.findByPk(order.restaurantId)
    const averageServiceTime = await restaurant.getAverageServiceTime()
    await Restaurant.update({ averageServiceMinutes: averageServiceTime }, { where: { id: order.restaurantId } })
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.show = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId']
      },
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'email', 'avatar', 'userType']
      },
      {
        model: Product,
        as: 'products'
      }]
    })
    res.json(order)
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.analytics = async function (req, res) {
  const yesterdayZeroHours = moment().subtract(1, 'days').set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  const todayZeroHours = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  try {
    const numYesterdayOrders = await Order.count({
      where:
      {
        createdAt: {
          [Op.lt]: todayZeroHours,
          [Op.gte]: yesterdayZeroHours
        },
        restaurantId: req.params.restaurantId
      }
    })
    const numPendingOrders = await Order.count({
      where:
      {
        startedAt: null,
        restaurantId: req.params.restaurantId
      }
    })
    const numDeliveredTodayOrders = await Order.count({
      where:
      {
        deliveredAt: { [Op.gte]: todayZeroHours },
        restaurantId: req.params.restaurantId
      }
    })

    const invoicedToday = await Order.sum(
      'price',
      {
        where:
        {
          createdAt: { [Op.gte]: todayZeroHours }, // FIXME: Created or confirmed?
          restaurantId: req.params.restaurantId
        }
      })
    res.json({
      restaurantId: req.params.restaurantId,
      numYesterdayOrders,
      numPendingOrders,
      numDeliveredTodayOrders,
      invoicedToday
    })
  } catch (err) {
    res.status(500).send(err)
  }
}
