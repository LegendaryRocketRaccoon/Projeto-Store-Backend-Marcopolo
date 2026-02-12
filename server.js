const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'FakeStore API - Projeto E-commerce',
    version: '1.0.0',
    endpoints: {
      products: {
        all: '/products',
        single: '/products/:id',
        categories: '/products/categories',
        byCategory: '/products/category/:category'
      }
    }
  });
});


app.use('/products', productRoutes);
app.use('/products/categories', categoryRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      status: err.status || 500
    }
  });
});


app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Rota não encontrada',
      status: 404
    }
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
  console.log(`http://localhost:3000/`);

});