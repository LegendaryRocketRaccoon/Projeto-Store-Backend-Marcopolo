const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();


const items = [
  {
    fakestoreId: 1,
    title: 'Headset',
    price: 299.9,
    category: 'acessórios de informática',
    image: 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS-CC1RXXYZ8k5d4MOUIAWdvop8Jxy_iXcfhio5RMM_d45qbnqCZ1ZhzWSk4UgazGVbnWxzenZnlVQh3l2PqUKPNP4KUUZcaiHny_mzo5C7Zt74U0bvo8rg36bLzxvvlx_I2unaFio&usqp=CAc'
  },
  {
    fakestoreId: 2,
    title: 'camiseta azul',
    price: 39.99,
    category: 'vestuário',
    image: 'https://images.tcdn.com.br/img/img_prod/1103332/camiseta_adulto_azul_royal_sublimatica_739796345_1_7fb0c945d85b498676f5370980be1f8f.png'
  },
  {
    fakestoreId: 3,
    title: 'O Senhor dos Anéis Box Trilogy',
    price: 119.5,
    category: 'livros',
    image: 'https://m.media-amazon.com/images/I/715afDdgKfL.jpg'
  }
];

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não definido em .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    console.log('Este script irá limpar a coleção `products` e inserir os itens definidos.');


    await Product.deleteMany({});
    console.log('Coleção `products` limpa.');


    const mapped = items.map((p, idx) => ({
      fakestoreId: p.fakestoreId != null ? p.fakestoreId : 1000 + idx,
      title: p.title || `Produto ${idx + 1}`,
      price: typeof p.price === 'number' ? p.price : 0,
      description: p.description || 'Sem descrição.',
      category: p.category || 'sem categoria',
      image: p.image || '',
      rating: p.rating || { rate: 0, count: 0 }
    }));

    const created = await Product.insertMany(mapped);
    console.log(`${created.length} produtos inseridos com sucesso.`);

    const categories = await Product.distinct('category');
    console.log('Categorias:', categories.join(', '));

    console.log('Seed custom concluído.');
    process.exit(0);
  } catch (error) {
    console.error('Erro no seed_custom:', error.message || error);
    process.exit(1);
  }
};

seedDatabase();