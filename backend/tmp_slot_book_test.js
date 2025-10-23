(async ()=>{
  try {
  const jwt = require('jsonwebtoken');
  // use global fetch provided by Node.js (18+)
  const fetch = global.fetch ? global.fetch : require('node-fetch');
    const base = 'http://localhost:4000';
    const secret = process.env.JWT_SECRET || 'change_me';

    console.log('Fetching tutors...');
    const tutorsRes = await fetch(base + '/api/tutors');
    const tutors = await tutorsRes.json();
    if (!Array.isArray(tutors) || tutors.length === 0) {
      console.error('No tutors available to test');
      process.exit(1);
    }
    const tutor = tutors[0];
    const tutorId = tutor._id || tutor.id;
    console.log('Selected tutor:', tutorId);

    // fetch slots for tutor
    const slotsRes = await fetch(base + '/api/slots/tutor/' + tutorId);
    const slots = await slotsRes.json();
    if (!Array.isArray(slots) || slots.length === 0) {
      console.error('No available slots for selected tutor');
      process.exit(2);
    }
    const slot = slots[0];
    console.log('Selected slot:', slot._id, slot.startAt);

    // create fake student token
    const randId = () => Math.floor(Math.random()*16).toString(16);
    const makeObjectId = () => Array.from({length:24}).map(randId).join('');
    const studentId = makeObjectId();
    const studentToken = jwt.sign({ userId: studentId }, secret);

    console.log('Booking slot as fake student...');
    const bookRes = await fetch(base + '/api/slots/' + slot._id + '/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + studentToken },
      body: JSON.stringify({ subject: 'Slot-Test', notes: 'Automated test booking' })
    });
    const booked = await bookRes.json();
    console.log('Book status:', bookRes.status, 'body:', booked);
    if (bookRes.status !== 200 && bookRes.status !== 201) process.exit(3);

    // now fetch sessions for the student
    const sessionsRes = await fetch(base + '/api/sessions?role=student', { headers: { 'Authorization': 'Bearer ' + studentToken } });
    const sessions = await sessionsRes.json();
    console.log('Sessions for student (count):', Array.isArray(sessions)? sessions.length : 'no-array', 'sample:', sessions && sessions[0]);

    process.exit(0);
  } catch (e) {
    console.error('Error in tmp_slot_book_test:', e);
    process.exit(99);
  }
})();
