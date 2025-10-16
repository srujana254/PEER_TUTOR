(async ()=>{
  try {
    const jwt = require('jsonwebtoken');
    const secret = 'change_me';
    const base = 'http://localhost:4000';

    console.log('Fetching tutors...');
    const tutorsRes = await fetch(base + '/api/tutors');
    const tutors = await tutorsRes.json();
    if (!Array.isArray(tutors) || tutors.length === 0) {
      console.error('No tutors available to test');
      process.exit(1);
    }
    const tutor = tutors[0];
    const tutorId = tutor._id || tutor.id;
    const tutorUserId = (tutor.userId && (tutor.userId._id || tutor.userId)) || tutor.userId || tutor.user?._id || tutor.user;
    console.log('Selected tutor:', tutorId, 'userId:', tutorUserId);

    // create a fake student id (ObjectId-like) to avoid conflicts with existing student
    const randId = () => Math.floor(Math.random()*16).toString(16);
    const makeObjectId = () => Array.from({length:24}).map(randId).join('');
    const studentId = makeObjectId();
    const studentToken = jwt.sign({ userId: studentId }, secret);

    // schedule 5 minutes from now
    const when = new Date(Date.now() + 5 * 60000).toISOString();
    const sessionPayload = { tutorId, subject: 'Test-Physics', scheduledAt: when, durationMinutes: 30 };
    console.log('Booking session as fake student...', sessionPayload);
    const bookRes = await fetch(base + '/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + studentToken },
      body: JSON.stringify(sessionPayload)
    });
    const booked = await bookRes.json();
    console.log('Booked response:', booked);
    if (bookRes.status !== 201) {
      console.error('Booking failed; aborting test');
      process.exit(1);
    }

    // create a tutor token using the tutor's user id
    if (!tutorUserId) {
      console.error('Tutor userId not available on tutor record, aborting');
      process.exit(1);
    }
    const tutorToken = jwt.sign({ userId: String(tutorUserId) }, secret);

    // find the session as tutor
    const listRes = await fetch(base + '/api/sessions?role=tutor', { headers: { 'Authorization': 'Bearer ' + tutorToken } });
    const list = await listRes.json();
    console.log('Tutor sessions (recent):', list && list.length ? list.length : 0);
    const sessionToStart = list && list.length ? list.find(s => s.subject === sessionPayload.subject && new Date(s.scheduledAt).toISOString() === when) : null;
    if (!sessionToStart) {
      // fallback: use the booked object
      console.error('Could not find session in tutor list; attempting to start using booked response');
    }
    const target = sessionToStart || booked;
    if (!target || !target._id) {
      console.error('No session id to start');
      process.exit(1);
    }

    console.log('Starting session', target._id);
    const startRes = await fetch(base + '/api/sessions/' + target._id + '/start', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tutorToken }
    });
    const started = await startRes.json();
    console.log('Start response:', started);
    if (startRes.ok && started.meetingUrl) {
      console.log('Meeting URL:', started.meetingUrl);
      process.exit(0);
    } else {
      console.error('Start failed', started);
      process.exit(1);
    }

  } catch (e) {
    console.error('Error in tmp_start_test2:', e);
    process.exit(1);
  }
})();
