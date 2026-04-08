const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function run() {
    try {
        const email = `test-${Date.now()}@example.com`;
        // 1. Register
        const regRes = await axios.post('http://localhost:3000/api/auth/register', {
            name: 'Test Setup User',
            email: email,
            password: 'Password123!',
            role: 'CANDIDATE'
        });

        const token = regRes.data.accessToken;
        console.log('Registered and got token');

        // 2. Create dummy resume
        const textPath = path.join(__dirname, 'dummy-resume.pdf');
        fs.writeFileSync(textPath, 'Dummy PDF content: I have skills in JavaScript, Python, and React.js. I have been doing this for 5 years.');

        // 3. Upload
        const form = new FormData();
        form.append('resume', fs.createReadStream(textPath), 'dummy-resume.pdf');

        console.log('Uploading...');
        const upRes = await axios.post('http://localhost:3000/api/resume/upload', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Upload response:', upRes.data);
    } catch (err) {
        if (err.response) {
            console.error('Error:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

run();
