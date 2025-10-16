const jwt = require('jsonwebtoken');
(async ()=>{
  try {
    const secret = process.env.JWT_SECRET || 'change_me';
    // use the tutor's user id from earlier: 68f070798f68de0a4846634e
    const tutorToken = jwt.sign({ userId: '68f070798f68de0a4846634e' }, secret);
    const when = new Date(Date.now() + 10 * 60000).toISOString();
    const payload = { tutorId: '68f070dc8f68de0a48466359', subject: 'Self-Book Test', scheduledAt: when, durationMinutes: 30 };
    const res = await fetch('http://localhost:4000/api/sessions', { method: 'POST', headers: { 'Authorization': 'Bearer ' + tutorToken, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), redirect: 'manual' });
    console.log('Status:', res.status);
    const body = await res.json().catch(()=>null);
    console.log('Body:', body);
  } catch (e) { console.error(e); }
})();