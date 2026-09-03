const mongoose = require('mongoose');

async function connectDb() {
  // Use local MongoDB for development if MONGODB_LOCAL_URI is set, otherwise use Atlas
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const localUri = process.env.MONGODB_LOCAL_URI;
  const atlasUri = process.env.MONGODB_URI;
  
  const uri = (isDevelopment && localUri) ? localUri : atlasUri;
  
  if (!uri) {
    throw new Error('MONGODB_URI is missing');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || 'KinBech',
  });

  const { host, name } = mongoose.connection;
  const connectionType = (isDevelopment && localUri) ? 'Local MongoDB' : 'MongoDB Atlas';
  console.log(`${connectionType} connected: ${host} / ${name}`);
}

module.exports = { connectDb };
