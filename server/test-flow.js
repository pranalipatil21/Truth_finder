const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  const api = axios.create({ baseURL: 'http://localhost:3000/api' });

  // 1. Register/Login
  const loginRes = await api.post('/auth/register', { 
    name: 'Test', email: 'test1@test.com', password: 'password123', role: 'CANDIDATE' 
  }).catch(() => api.post('/auth/login', { email: 'test1@test.com', password: 'password123' }));
  
  const token = loginRes.data.accessToken;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // 2. Upload resume
  const form = new FormData();
  form.append('resume', Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n'), { filename: 'resume.pdf', contentType: 'application/pdf' });
  
  console.log('Uploading...');
  const uploadRes = await api.post('/resume/upload', form, { headers: form.getHeaders() });
  const resumeId = uploadRes.data.resume.id;
  console.log('Uploaded:', resumeId);

  // 3. Wait for parsing
  console.log('Waiting for parsing...');
  let status = 'UPLOADED';
  while (status !== 'PARSED' && status !== 'FAILED') {
    await new Promise(r => setTimeout(r, 2000));
    const res = await api.get('/resume');
    const resume = res.data.find(r => r.id === resumeId);
    status = resume.status;
    console.log('Status:', status);
  }

  // 4. Create session
  if (status === 'PARSED') {
    console.log('Creating session...');
    try {
      const sessionRes = await api.post('/assessment/sessions', { resumeId });
      console.log('Session created:', sessionRes.data.session.id);
    } catch (err) {
      console.error('Failed to create session:', err.response?.status, err.response?.data);
    }
  }
}
test().catch(console.error);
