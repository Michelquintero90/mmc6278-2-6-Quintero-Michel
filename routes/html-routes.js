const router = require('express').Router()
const db = require('../db')

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM inventory;')
    const [[{ cartCount }]] = await db.query('SELECT SUM(quantity) AS cartCount FROM cart;')

    res.render('index', { inventory: rows, cartCount })
  } catch (error) {
    console.error(error)
    res.status(500).send('Error loading index page')
  }
})

router.get('/product/:id', async (req, res) => {
  try {
    const [[product]] = await db.query(
      'SELECT * FROM inventory WHERE id=?;',
      [req.params.id]
    )
    const [[{ cartCount }]] = await db.query('SELECT SUM(quantity) AS cartCount FROM cart;')

    res.render('product', { product, cartCount })
  } catch (error) {
    console.error(error)
    res.status(500).send('Error loading product page')
  }
})

router.get('/cart', async (req, res) => {
  try {
    const [cartItems] = await db.query(
      `SELECT
        cart.id,
        cart.inventory_id AS inventoryId,
        cart.quantity,
        inventory.price,
        ROUND(inventory.price * cart.quantity, 2) AS calculatedPrice,
        inventory.name,
        inventory.image,
        inventory.quantity AS inventoryQuantity
      FROM cart LEFT JOIN inventory ON cart.inventory_id=inventory.id`
    )
    const total = cartItems
      .reduce((total, item) => item.calculatedPrice + total, 0)
      .toFixed(2)

    res.render('cart', { cartItems, total })
  } catch (error) {
    console.error(error)
    res.status(500).send('Error loading cart page')
  }
})

module.exports = router
