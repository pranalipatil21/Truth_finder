const axios = require('axios');
async function test() {
  const api = axios.create({ baseURL: 'http://localhost:3000/api' });
  const loginRes = await api.post('/auth/register', { 
    name: 'Test', email: 'test2@test.com', password: 'password123', role: 'CANDIDATE' 
  }).catch(() => api.post('/auth/login', { email: 'test2@test.com', password: 'password123' }));
  
  const token = loginRes.data.accessToken;
  
  try {
    await api.post('/assessment/sessions', { resumeId: 'not-a-uuid' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    console.log('STATUS:', err.response?.status);
    console.log('DATA:', err.response?.data);
  }
}
test().catch(console.error);
