// E2E helper script (ES module style) - creates tutor then creates slots
(async () => {
  try {
    const ts = Date.now();
    const email = `auto+${ts}@example.com`;
    console.log('signup email:', email);
    let res = await fetch('http://localhost:4000/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Pass1234', fullName: 'Auto Tutor' }) });
    console.log('signup status', res.status);
    const signup = await res.json();
    console.log('signup body', signup);

    res = await fetch('http://localhost:4000/api/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Pass1234' }) });
    console.log('signin status', res.status);
    const signin = await res.json();
    console.log('signin body', signin);
    const token = signin.token;

    res = await fetch('http://localhost:4000/api/tutors/become', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ subjects: ['Math'], bio: 'Auto create tutor', hourlyRate: 300 }) });
    console.log('become status', res.status);
    console.log('become body', await res.json());

    const tomorrow = new Date(Date.now() + 24*3600*1000);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth()+1).padStart(2,'0');
    const dd = String(tomorrow.getDate()).padStart(2,'0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    res = await fetch('http://localhost:4000/api/slots/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ date: dateStr, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 }) });
    console.log('create slots status', res.status);
    console.log('create body', await res.json());

  } catch (err) { console.error(err); process.exit(1); }
})();
