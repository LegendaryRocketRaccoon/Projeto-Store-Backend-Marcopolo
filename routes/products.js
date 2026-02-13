const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

router.get('/', async (req, res) => {
  try {
    const { sort, limit, search, category } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      const cat = await Category.findOne({ slug: category }).lean();
      if (!cat) return res.status(404).json({ error: 'Categoria não encontrada' });

      const descendants = await Category
        .find({ $or: [{ _id: cat._id }, { 'ancestors._id': cat._id }], isActive: true })
        .select('_id')
        .lean();

      const catIds = descendants.map(c => c._id);
      filter.categories = { $in: catIds };
    }

    let productsQuery = Product.find(filter);

    if (sort) {
      const [field, order] = String(sort).split('_');
      const safeFields = ['price', 'title', 'createdAt'];
      const safeField = safeFields.includes(field) ? field : 'createdAt';
      const sortOrder = order === 'asc' ? 1 : -1;
      productsQuery = productsQuery.sort({ [safeField]: sortOrder });
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    if (limit) {
      const n = parseInt(limit, 10);
      if (!Number.isNaN(n) && n > 0 && n <= 100) productsQuery = productsQuery.limit(n);
    }

    const products = await productsQuery.lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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