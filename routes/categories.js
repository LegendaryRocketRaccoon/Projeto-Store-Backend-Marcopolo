const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;