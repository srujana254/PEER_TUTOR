const { MongoClient, ObjectId } = require('mongodb');
(async ()=>{
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const sessionId = new ObjectId('68f0c6176b75f34c486696cb');
    const session = await db.collection('sessions').findOne({ _id: sessionId });
    console.log('Session for student (raw):', session);
  } catch (e) { console.error(e); } finally { await client.close(); }
})();