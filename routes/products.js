const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

// GET /products - Obter todos os produtos
// Suporta query params: sort, limit, search
router.get('/', async (req, res) => {
  try {
    const { sort, limit, search } = req.query;
    
    let query = {};
    
    // Busca por texto
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let productsQuery = Product.find(query);
    
    // Ordenação
    if (sort) {
      // Exemplos: sort=price_asc, sort=price_desc, sort=title_asc, sort=title_desc
      const [field, order] = sort.split('_');
      const sortOrder = order === 'desc' ? -1 : 1;
      productsQuery = productsQuery.sort({ [field]: sortOrder });
    }
    
    // Limitar resultados
    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }
    
    const products = await productsQuery;
    
    res.json(products);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// GET /products/category/:category - Obter produtos por categoria
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { sort, limit } = req.query;
    
    let productsQuery = Product.find({ category });
    
    // Ordenação
    if (sort) {
      const [field, order] = sort.split('_');
      const sortOrder = order === 'desc' ? -1 : 1;
      productsQuery = productsQuery.sort({ [field]: sortOrder });
    }
    
    // Limitar resultados
    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }
    
    const products = await productsQuery;
    
    res.json(products);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// GET /products/:id - Obter um produto específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;

    if (mongoose.isValidObjectId(id)) {
      product = await Product.findById(id);
    }

    if (!product) {
      const numericId = Number(id);
      if (!Number.isNaN(numericId)) {
        product = await Product.findOne({ fakestoreId: numericId });
      }
    }

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;