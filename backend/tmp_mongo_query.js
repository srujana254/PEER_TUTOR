const { MongoClient } = require('mongodb');
(async ()=>{
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const now = new Date();
    const from = new Date(now.getTime() - 60*60000);
    const to = new Date(now.getTime() + 60*60000);
    const sessions = await db.collection('sessions').find({ scheduledAt: { $gte: from, $lte: to } }).toArray();
    console.log('Sessions within +-60m:', sessions);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
