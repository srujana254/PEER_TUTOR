(async ()=>{
  try {
    const fetch = global.fetch ? global.fetch : require('node-fetch');
    const jwt = require('jsonwebtoken');
    const base = 'http://localhost:4000';
  // note: auth.middleware uses 'dev_secret' as default; use the same to craft test tokens
  const secret = process.env.JWT_SECRET || 'dev_secret';

    // 1) create a tutor account
    const email = `test-tutor-${Date.now()}@example.com`;
    const password = 'pass1234';
    const fullName = 'Test Tutor';
    console.log('Signing up tutor:', email);
    const su = await fetch(base + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, fullName }) });
    const suBody = await su.json();
    if (su.status !== 201) { console.error('Signup failed', su.status, suBody); process.exit(1); }
    console.log('Signed up tutor id:', suBody.id);

    // sign in to receive token
    const si = await fetch(base + '/api/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const siBody = await si.json();
    if (!siBody.token) { console.error('Signin failed', si.status, siBody); process.exit(2); }
    const tutorToken = siBody.token;
    console.log('Tutor token acquired');

    // become a tutor
    const become = await fetch(base + '/api/tutors/become', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tutorToken }, body: JSON.stringify({ subjects: ['Math'], bio: 'Test bio', hourlyRate: 20 }) });
    const becomeBody = await become.json();
    if (!become.ok && !becomeBody._id) console.log('become result:', become.status, becomeBody);
    const tutorProfileId = becomeBody._id || becomeBody.id;
    console.log('Tutor profile created:', tutorProfileId);

    // create slots for today +5 minutes
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const date = now.toISOString().slice(0,10);
    const startTime = now.toTimeString().slice(0,5);
    const end = new Date(now.getTime() + 60*60000);
    const endTime = end.toTimeString().slice(0,5);
    console.log('Creating slots', date, startTime, endTime);
    const createSlots = await fetch(base + '/api/slots/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tutorToken }, body: JSON.stringify({ date, startTime, endTime, slotDurationMinutes: 30 }) });
    const csBody = await createSlots.json();
    console.log('Slots creation response:', createSlots.status, csBody);
    if (createSlots.status >= 400) process.exit(3);
    const createdSlots = csBody.slots || [];
    if (!createdSlots.length) { console.error('No slots created'); process.exit(4); }

    const slot = createdSlots[0];
    console.log('Slot created:', slot._id, slot.startAt);

    // create a real student account and sign in to get a valid token
    const studentEmail = `test-student-${Date.now()}@example.com`;
    const studentPass = 'pass1234';
    const studentName = 'Test Student';
    console.log('Signing up student:', studentEmail);
    const ssu = await fetch(base + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: studentEmail, password: studentPass, fullName: studentName }) });
    const ssuBody = await ssu.json();
    if (ssu.status !== 201) { console.error('Student signup failed', ssu.status, ssuBody); process.exit(10); }
    const ssi = await fetch(base + '/api/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: studentEmail, password: studentPass }) });
    const ssiBody = await ssi.json();
    if (!ssiBody.token) { console.error('Student signin failed', ssi.status, ssiBody); process.exit(11); }
    const studentToken = ssiBody.token;

    // book slot using real student token
    console.log('Booking slot as student...');
    const bookRes = await fetch(base + '/api/slots/' + slot._id + '/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + studentToken },
      body: JSON.stringify({ subject: 'Slot-Test', notes: 'Automated test booking' })
    });
    const booked = await bookRes.json();
    console.log('Book status:', bookRes.status, 'body:', booked);
    if (!(bookRes.status === 200 || bookRes.status === 201)) process.exit(5);

    // fetch sessions for the student
    const sessionsRes = await fetch(base + '/api/sessions?role=student', { headers: { 'Authorization': 'Bearer ' + studentToken } });
    const sessions = await sessionsRes.json();
    console.log('Sessions for student (count):', Array.isArray(sessions)? sessions.length : 'no-array', 'sample:', sessions && sessions[0]);

    process.exit(0);
  } catch (e) {
    console.error('Error in tmp_setup_and_book_test:', e);
    process.exit(99);
  }
})();
