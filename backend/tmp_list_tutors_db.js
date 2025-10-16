const mongoose = require('mongoose');
let Tutor;
try { Tutor = require('./dist/models/TutorProfile').TutorProfile; } catch (e) { Tutor = require('./src/models/TutorProfile').TutorProfile; }
(async ()=>{
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app');
    const tutors = await Tutor.find({}).limit(20).lean();
    console.log('Tutors:', tutors.map(t => ({ _id: String(t._id), userId: t.userId, subjects: t.subjects })));
  } catch (e) { console.error(e); }
  process.exit(0);
})();
