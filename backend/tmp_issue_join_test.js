const jwt = require('jsonwebtoken');
(async ()=>{
  const secret = process.env.JWT_SECRET || 'change_me';
  const tutorToken = jwt.sign({ userId: '68f070798f68de0a4846634e' }, secret);
  const res = await fetch('http://localhost:4000/api/sessions/68f0c6176b75f34c486696cb/issue-join', { method: 'POST', headers: { 'Authorization': 'Bearer ' + tutorToken } });
  const body = await res.json();
  console.log('issue-join response:', res.status, body);
})();