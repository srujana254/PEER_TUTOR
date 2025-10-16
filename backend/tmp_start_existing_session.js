const { MongoClient } = require('mongodb');
// use global fetch available in Node 18+
const jwt = require('jsonwebtoken');
(async ()=>{
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const sessionId = '68f0c6176b75f34c486696cb';
  const { ObjectId } = require('mongodb');
  const session = await db.collection('sessions').findOne({ _id: new ObjectId(sessionId) });
    console.log('Found session:', session);
    if (!session) return process.exit(1);
    const tutorId = session.tutorId;
    const tutor = await db.collection('tutorprofiles').findOne({ _id: tutorId });
    console.log('Tutor doc:', tutor);
    if (!tutor) return process.exit(1);
    const tutorUserId = tutor.userId && (tutor.userId._id || tutor.userId) || tutor.user?._id || tutor.user;
    console.log('Tutor userId:', tutorUserId);
    const secret = process.env.JWT_SECRET || 'change_me';
    const token = jwt.sign({ userId: String(tutorUserId) }, secret);
    console.log('Starting session via API...');
    const base = 'http://localhost:4000';
  const res = await fetch(base + '/api/sessions/' + sessionId + '/start', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    const body = await res.json();
    console.log('Start response status:', res.status, body);
  } catch (e) { console.error(e); } finally { await client.close(); }
})();