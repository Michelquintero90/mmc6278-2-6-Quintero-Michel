const router = require('express').Router();
const db = require('../db');

router
  .route('/cart')
  .post(async (req, res) => {
    try {
      const { quantity } = req.body;
      const { inventoryId } = req.query;

      if (!inventoryId) return res.status(400).json({ error: 'Missing inventoryId' });

      const [[item]] = await db.query(
        `SELECT
          inventory.id,
          name,
          price,
          inventory.quantity AS inventoryQuantity,
          cart.id AS cartId
        FROM inventory
        LEFT JOIN cart ON cart.inventory_id = inventory.id
        WHERE inventory.id = ?;`,
        [inventoryId]
      );

      if (!item) return res.status(404).json({ error: 'Item not found' });

      const { cartId, inventoryQuantity } = item;
      if (quantity > inventoryQuantity) return res.status(409).json({ error: 'Not enough inventory' });

      if (cartId) {
        await db.query(`UPDATE cart SET quantity = quantity + ? WHERE inventory_id = ?`, [quantity, inventoryId]);
      } else {
        await db.query(`INSERT INTO cart (inventory_id, quantity) VALUES (?, ?)`, [inventoryId, quantity]);
      }

      res.json({ message: 'Item added to cart' });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  .delete(async (req, res) => {
    try {
      await db.query('DELETE FROM cart');
      res.json({ message: 'Cart cleared' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

router
  .route('/cart/:cartId')
  .put(async (req, res) => {
    try {
      const { quantity } = req.body;
      const { cartId } = req.params;

      const [[cartItem]] = await db.query(
        `SELECT inventory.quantity AS inventoryQuantity
        FROM cart
        LEFT JOIN inventory ON cart.inventory_id = inventory.id
        WHERE cart.id = ?`,
        [cartId]
      );

      if (!cartItem) return res.status(404).json({ error: 'Cart item not found' });

      const { inventoryQuantity } = cartItem;
      if (quantity > inventoryQuantity) return res.status(409).json({ error: 'Not enough inventory' });

      if (quantity > 0) {
        await db.query(`UPDATE cart SET quantity = ? WHERE id = ?`, [quantity, cartId]);
      } else {
        await db.query(`DELETE FROM cart WHERE id = ?`, [cartId]);
      }

      res.json({ message: 'Cart item updated' });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  .delete(async (req, res) => {
    try {
      const { cartId } = req.params;
      const [{ affectedRows }] = await db.query(`DELETE FROM cart WHERE id = ?`, [cartId]);

      if (affectedRows === 1) {
        res.json({ message: 'Cart item deleted' });
      } else {
        res.status(404).json({ error: 'Cart item not found' });
      }
    } catch (error) {
      console.error('Error deleting cart item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = router;
