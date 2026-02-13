const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI não foi definido no .env');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('Erro de conexão MongoDB:', err.message);
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexão Mongo encerrada (SIGINT).');
    process.exit(0);
  });
};

module.exports = connectDB;
