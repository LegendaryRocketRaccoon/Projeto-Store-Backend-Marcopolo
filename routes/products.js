const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { toObjectId, now, pick } = require('../utils/validators');

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');

    const {
      search,
      category,
      sort = 'createdAt_desc',
      page = '1',
      pageSize = '20'
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    const filter = {};
    if (category) {
      const catId = toObjectId(category);
      if (!catId) return res.status(400).json({ error: 'category inválido' });
      filter.category = catId;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const [field, order] = String(sort).split('_');
    const safeFields = ['price', 'title', 'createdAt'];
    const safeField = safeFields.includes(field) ? field : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const cursor = col.find(filter).sort({ [safeField]: sortOrder })
                       .skip((pageNum - 1) * perPage).limit(perPage);

    const [items, total] = await Promise.all([cursor.toArray(), col.countDocuments(filter)]);

    res.json({ items, page: pageNum, pageSize: perPage, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const doc = await col.findOne({ _id });
    if (!doc) return res.status(404).json({ error: 'Produto não encontrado' });

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const products = db.collection('products');
    const categories = db.collection('categories');

    const payload = pick(req.body, [
      'title', 'price', 'description', 'imageUrl', 'category'
    ]);

    if (!payload.title || typeof payload.title !== 'string') {
      return res.status(400).json({ error: 'title é obrigatório' });
    }
    if (typeof payload.price !== 'number' || payload.price < 0) {
      return res.status(400).json({ error: 'price deve ser número >= 0' });
    }

    const categoryId = toObjectId(payload.category);
    if (!categoryId) return res.status(400).json({ error: 'category inválido' });

    const cat = await categories.findOne({ _id: categoryId }, { projection: { _id: 1 } });
    if (!cat) return res.status(400).json({ error: 'Categoria não encontrada' });

    const doc = {
      title: payload.title.trim(),
      price: payload.price,
      description: (payload.description || '').trim(),
      imageUrl: (payload.imageUrl || '').trim(),
      category: categoryId,
      rating: { total: 0, sum: 0, avg: 0 },
      createdAt: now(),
      updatedAt: now()
    };

    const result = await products.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const db = getDB();
    const products = db.collection('products');
    const categories = db.collection('categories');

    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const payload = pick(req.body, [
      'title', 'price', 'description', 'imageUrl', 'category'
    ]);

    const update = {};
    if (payload.title) update.title = payload.title.trim();
    if (payload.description !== undefined) update.description = (payload.description || '').trim();
    if (payload.imageUrl !== undefined) update.imageUrl = (payload.imageUrl || '').trim();
    if (payload.price !== undefined) {
      if (typeof payload.price !== 'number' || payload.price < 0) {
        return res.status(400).json({ error: 'price deve ser número >= 0' });
      }
      update.price = payload.price;
    }
    if (payload.category !== undefined) {
      const categoryId = toObjectId(payload.category);
      if (!categoryId) return res.status(400).json({ error: 'category inválido' });
      const cat = await categories.findOne({ _id: categoryId }, { projection: { _id: 1 } });
      if (!cat) return res.status(400).json({ error: 'Categoria não encontrada' });
      update.category = categoryId;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Nada para atualizar' });
    }
    update.updatedAt = now();

    const result = await products.findOneAndUpdate(
      { _id }, { $set: update }, { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ error: 'Produto não encontrado' });

    res.json(result.value);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/rate', async (req, res) => {
  try {
    const db = getDB();
    const products = db.collection('products');
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const { score } = req.body;
    const s = Number(score);
    if (!Number.isFinite(s) || s < 0 || s > 5) {
      return res.status(400).json({ error: 'score deve estar entre 0 e 5' });
    }

    const result = await products.findOneAndUpdate(
      { _id },
      [
        {
          $set: {
            'rating.total': { $add: ['$rating.total', 1] },
            'rating.sum': { $add: ['$rating.sum', s] }
          }
        },
        {
          $set: {
            'rating.avg': { $cond: [
              { $gt: [{ $add: ['$rating.total', 1] }, 0] },
              { $divide: [{ $add: ['$rating.sum', s] }, { $add: ['$rating.total', 1] }] },
              0
            ]}
          }
        },
        { $set: { updatedAt: new Date() } }
      ],
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(result.value);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;