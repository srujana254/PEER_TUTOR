const { MongoClient, ObjectId } = require('mongodb');
(async ()=>{
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const studentId = new ObjectId('68f00900b5c343cb937432c0');
    const notifs = await db.collection('notifications').find({ userId: studentId }).sort({ createdAt: -1 }).toArray();
    console.log('Notifications for student:', notifs);
  } catch (e) { console.error(e); } finally { await client.close(); }
})();