require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI não definido no .env');
  process.exit(1);
}

const categoryDefinitions = [
  { name: 'Books', description: 'Livros em geral' },
  { name: 'Comics', description: 'Quadrinhos e HQs' },
  { name: 'Clothing', description: 'Roupas' },
  { name: 'Computer Accessories', description: 'Acessórios de computador' },
  { name: 'Collectibles', description: 'Colecionáveis' }
];

const items = [
  {
    title: 'Headset',
    price: 299.9,
    description: 'Headset Gamer 7.1, cancelamento de ruído, RGB',
    imageUrl: 'https://exemplo.com/headset.jpg',
    categoryName: 'Computer Accessories'
  },
  { title: 'Camiseta Azul', price: 39.99, imageUrl: 'https://exemplo.com/camisa.jpg', categoryName: 'Clothing' },
  { title: 'O Hobbit', price: 49.9, imageUrl: 'https://exemplo.com/hobbit.jpg', categoryName: 'Books' }
];

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const categories = db.collection('categories');
    const products = db.collection('products');

    await Promise.all([
      categories.deleteMany({}),
      products.deleteMany({})
    ]);

    const now = new Date();

    const catDocs = categoryDefinitions.map(c => ({
      name: c.name,
      description: c.description || '',
      createdAt: now,
      updatedAt: now
    }));
    const catRes = await categories.insertMany(catDocs);

    const nameToId = {};
    for (const [idx, c] of Object.entries(catDocs)) {
      const insertedId = catRes.insertedIds[idx];
      nameToId[c.name] = insertedId;
    }

    const prodDocs = items.map(p => ({
      title: p.title,
      price: p.price || 0,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      category: nameToId[p.categoryName],
      rating: { total: 0, sum: 0, avg: 0 },
      createdAt: now,
      updatedAt: now
    })).filter(p => p.category instanceof ObjectId);

    const inserted = await products.insertMany(prodDocs);
    console.log(`Seed concluído. Categorias: ${catDocs.length}, Produtos: ${Object.keys(inserted.insertedIds).length}`);

    await Promise.all([
      categories.createIndex({ createdAt: -1 }),
      products.createIndex({ createdAt: -1 }),
      products.createIndex({ price: 1 }),
      products.createIndex({ category: 1 }),
      products.createIndex({ title: 'text', description: 'text' })
    ]);

    process.exit(0);
  } catch (e) {
    console.error('Erro no seed:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();