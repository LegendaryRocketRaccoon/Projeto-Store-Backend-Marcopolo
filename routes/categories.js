const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /products/categories - Obter todas as categorias
router.get('/', async (req, res) => {
  try {
    // Buscar categorias únicas dos produtos
    const categories = await Product.distinct('category');
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;