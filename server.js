const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Para importar rotas
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

// Para configurar variáveis de ambiente
dotenv.config();

// Para criar app Express
const app = express();

// Para conectar ao banco de dados
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste
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

// Rotas da API
app.use('/products', productRoutes);
app.use('/products/categories', categoryRoutes);

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      status: err.status || 500
    }
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Rota não encontrada',
      status: 404
    }
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
});