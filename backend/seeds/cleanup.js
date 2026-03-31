const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/farm2home').then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').deleteMany({ mobile: { $ne: '+919999999999' } });
  const fp = await db.collection('farmerprofiles').deleteMany({});
  const cp = await db.collection('customerprofiles').deleteMany({});
  const products = await db.collection('products').deleteMany({});
  const orders = await db.collection('orders').deleteMany({});
  const reviews = await db.collection('reviews').deleteMany({});
  const dp = await db.collection('deliverypartners').deleteMany({});
  console.log('Cleared:', users.deletedCount, 'users,', fp.deletedCount, 'farmer profiles,', cp.deletedCount, 'customer profiles,', products.deletedCount, 'products,', orders.deletedCount, 'orders');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
