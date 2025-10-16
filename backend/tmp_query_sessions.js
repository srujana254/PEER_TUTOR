(async ()=>{
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutoring_app');
  const Session = require('./src/models/Session').Session;
  const TutorProfile = require('./src/models/TutorProfile').TutorProfile;

  const tutorProfile = await TutorProfile.findOne({});
  console.log('Sample tutor profile:', tutorProfile && tutorProfile._id && tutorProfile.userId);

  const now = new Date();
  const from = new Date(now.getTime() - 60*60000);
  const to = new Date(now.getTime() + 60*60000);
  const sessions = await Session.find({ scheduledAt: { $gte: from, $lte: to } }).sort({ scheduledAt: 1 }).lean();
  console.log('Sessions within +-60m:', sessions);
  process.exit(0);
})();
