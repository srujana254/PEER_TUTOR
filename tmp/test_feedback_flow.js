const fetch = require('node-fetch');
const api = 'http://localhost:4000/api';
(async () => {
  try {
    // 1) sign up tutor
    const tutorEmail = `tutor${Date.now()}@example.com`;
    const tutRes = await fetch(`${api}/auth/signup`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ email: tutorEmail, password: 'password', fullName: 'Tutor One' }) });
    const tut = await tutRes.json();
    console.log('tutor signup', tut);
    // 2) mark tutor as tutor in DB via signin and /api/tutors/me? There may be endpoints to become tutor; fallback: create tutor profile via /api/tutors (check route)...
    // For brevity in this quick test, assume backend auto-creates tutor not required — attempt sign in
    const signInTut = await fetch(`${api}/auth/signin`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ email: tutorEmail, password: 'password' }) });
    const signTutJson = await signInTut.json();
    console.log('tutor signin', signTutJson);

    const tokenTut = signTutJson.token;
    // 3) create tutor profile via /api/tutors (if exists)
    let tutorProfile = null;
    try {
      const createProfile = await fetch(`${api}/tutors`, { method: 'POST', headers: {'content-type':'application/json','authorization': `Bearer ${tokenTut}`}, body: JSON.stringify({ bio: 'Test tutor', hourlyRate: 20 }) });
      const cp = await createProfile.json();
      tutorProfile = cp;
      console.log('tutor profile', cp);
    } catch(e) { console.log('create tutor profile failed', e); }

    // 4) create a slot if route exists
    let slot = null;
    try {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 60);
      const end = new Date(now.getTime() + 60*60000);
      const slotRes = await fetch(`${api}/slots`, { method: 'POST', headers: {'content-type':'application/json','authorization': `Bearer ${tokenTut}`}, body: JSON.stringify({ startAt: now.toISOString(), endAt: end.toISOString(), durationMinutes: 60 }) });
      slot = await slotRes.json();
      console.log('created slot', slot);
    } catch (e) { console.log('create slot failed', e); }

    // 5) sign up student
    const studentEmail = `student${Date.now()}@example.com`;
    await fetch(`${api}/auth/signup`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ email: studentEmail, password: 'password', fullName: 'Student One' }) });
    const signInStu = await fetch(`${api}/auth/signin`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ email: studentEmail, password: 'password' }) });
    const stuJson = await signInStu.json();
    console.log('student signin', stuJson);
    const tokenStu = stuJson.token;

    // 6) book the slot
    let session = null;
    if (slot && slot._id) {
      const book = await fetch(`${api}/slots/${slot._id}/book`, { method: 'POST', headers: {'content-type':'application/json','authorization': `Bearer ${tokenStu}`}, body: JSON.stringify({ subject: 'Test', notes: 'Testing booking' }) });
      const bookJson = await book.json();
      console.log('book response', bookJson);
      session = bookJson && bookJson.session ? bookJson.session : null;
    }

    // 7) leave feedback
    if (!session) {
      console.log('no session available to leave feedback');
      return;
    }
    const leave = await fetch(`${api}/feedback`, { method: 'POST', headers: {'content-type':'application/json','authorization': `Bearer ${tokenStu}`}, body: JSON.stringify({ sessionId: session._id || session.id, tutorId: session.tutorId || session.tutor }) });
    const leaveJson = await leave.json();
    console.log('leave feedback response', leaveJson);
  } catch (e) {
    console.error(e);
  }
})();
