(async ()=>{
  try {
    const jwt = require('jsonwebtoken');
    // Dev secret from .env
    const secret = 'change_me';

    // IDs from dev DB (observed earlier)
    const tutorId = '68f070dc8f68de0a48466359';
    const studentId = '68efbc95c9e1fab4e7cc4c57';

    const studentToken = jwt.sign({ userId: studentId }, secret);
    const tutorToken = jwt.sign({ userId: '68f070798f68de0a4846634e' }, secret);

  // schedule 5 minutes from now so tutor can start (start window allows 15 minutes before)
  const when = new Date(Date.now() + 5 * 60000).toISOString();
    const sessionPayload = { tutorId, subject: 'Biology', scheduledAt: when, durationMinutes: 30 };

    console.log('Booking session as student...', sessionPayload);
    const bookRes = await fetch('http://localhost:4000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + studentToken },
      body: JSON.stringify(sessionPayload)
    });
    const booked = await bookRes.json();
    console.log('Booked:', booked);

    // Wait a second and fetch tutor sessions
    await new Promise(r => setTimeout(r, 1000));

    const listRes = await fetch('http://localhost:4000/api/sessions?role=tutor', {
      headers: { 'Authorization': 'Bearer ' + tutorToken }
    });
    const list = await listRes.json();
    console.log('Tutor sessions:', list);

    const sessionToStart = list && list.length ? list[0] : booked;
    if (!sessionToStart || !sessionToStart._id) {
      console.error('No session found to start');
      process.exit(1);
    }

    console.log('Attempting to start session', sessionToStart._id);
    const startRes = await fetch('http://localhost:4000/api/sessions/' + sessionToStart._id + '/start', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tutorToken }
    });
    const started = await startRes.json();
    console.log('Start response:', started);
  } catch (e) {
    console.error('Error in tmp test:', e);
    process.exit(1);
  }
})();
