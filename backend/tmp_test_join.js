const { MongoClient, ObjectId } = require('mongodb');
(async ()=>{
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const sessionId = new ObjectId('68f0c6176b75f34c486696cb');
    const session = await db.collection('sessions').findOne({ _id: sessionId });
    console.log('Session:', session);
    if (!session || !session.joinToken) return console.log('No joinToken present');
    const token = session.joinToken;
    const base = 'http://localhost:4000';
    console.log('Calling join endpoint (no redirect)...');
    const res = await fetch(base + '/api/sessions/' + sessionId.toString() + '/join?token=' + encodeURIComponent(token), { method: 'GET', redirect: 'manual' });
    console.log('Join response status:', res.status);
    const loc = res.headers.get('location');
    console.log('Location header:', loc);

    const logs = await db.collection('joinlogs').find({ sessionId: sessionId }).toArray();
    console.log('Join logs for session:', logs);
  } catch (e) { console.error(e); } finally { await client.close(); }
})();