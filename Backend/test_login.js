const fetch = require('node-fetch');

const login = async () => {
    const url = 'http://localhost:5182/api/Account/login';
    const payload = {
        Email: 'admin@houndheart.com',
        Password: 'Admin@123'
    };

    console.log('Testing URL:', url);
    console.log('With Payload:', JSON.stringify(payload));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response body:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
};

login();
