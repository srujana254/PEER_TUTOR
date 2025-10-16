const { MongoClient } = require('mongodb');
(async ()=>{
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const logs = await db.collection('joinlogs').find({}).sort({ createdAt: -1 }).limit(50).toArray();
    console.log('Join logs:', logs.map(l=>({ _id: String(l._id), sessionId: String(l.sessionId), tokenSnippet: l.tokenSnippet, ip: l.ip, userAgent: l.userAgent, createdAt: l.createdAt })));
  } catch (e) { console.error(e); }
  finally { await client.close(); process.exit(0); }
})();
