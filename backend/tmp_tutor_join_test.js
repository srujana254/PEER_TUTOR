const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
(async ()=>{
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const sessionId = new ObjectId('68f0c6176b75f34c486696cb');
    const session = await db.collection('sessions').findOne({ _id: sessionId });
    console.log('Session:', session);
    const tutorProfile = await db.collection('tutorprofiles').findOne({ _id: session.tutorId });
    const tutorUserId = tutorProfile.userId;
    const secret = process.env.JWT_SECRET || 'change_me';
    const tutorToken = jwt.sign({ userId: String(tutorUserId) }, secret);
    // call join endpoint with Authorization header
    const res = await fetch('http://localhost:4000/api/sessions/' + sessionId.toString() + '/join', { method: 'GET', headers: { 'Authorization': 'Bearer ' + tutorToken }, redirect: 'manual' });
    console.log('Join response status:', res.status, 'location:', res.headers.get('location'));
    const logs = await db.collection('joinlogs').find({ sessionId }).sort({ createdAt: -1 }).limit(5).toArray();
    console.log('Recent join logs:', logs);
  } catch (e) { console.error(e); } finally { await client.close(); }
})();