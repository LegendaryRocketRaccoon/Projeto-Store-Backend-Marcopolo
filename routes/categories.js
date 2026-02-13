const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { toSlug } = require('../utils/slug');

router.get('/', async (req, res) => {
  try {
    const { parent = 'root' } = req.query;
    const filter = parent === 'root' ? { parentId: null } : { parentId: parent };
    const items = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tree', async (_req, res) => {
  try {
    const items = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    const byId = Object.fromEntries(items.map(c => [String(c._id), { ...c, children: [] }]));
    const roots = [];
    items.forEach(c => {
      if (c.parentId) byId[String(c.parentId)]?.children.push(byId[String(c._id)]);
      else roots.push(byId[String(c._id)]);
    });
    res.json(roots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).lean();
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });
    const breadcrumb = [...(category.ancestors || []), { _id: category._id, slug: category.slug, name: category.name }];
    res.json({ category, breadcrumb });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, parentId, isActive = true, sortOrder = 0 } = req.body;
    const slug = toSlug(req.body.slug || name);
    const exists = await Category.findOne({ slug }).lean();
    if (exists) return res.status(409).json({ message: 'Slug já existe' });

    const created = await Category.create({ name, slug, parentId: parentId || null, isActive, sortOrder });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Categoria não encontrada' });

    const { name, parentId, isActive, sortOrder, slug } = req.body;
    if (name) cat.name = name;
    if (slug) cat.slug = toSlug(slug);
    if (typeof isActive === 'boolean') cat.isActive = isActive;
    if (typeof sortOrder === 'number') cat.sortOrder = sortOrder;
    if (parentId !== undefined) cat.parentId = parentId || null;

    await cat.save();
    res.json(cat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const hasChildren = await Category.exists({ parentId: req.params.id });
    if (hasChildren) return res.status(409).json({ message: 'Remova/mova as subcategorias antes' });

    await Category.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;