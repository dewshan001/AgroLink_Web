const http = require('http');

const data = JSON.stringify({
    crop_name: 'Tomatoes',
    category_id: 'Vegetables',
    quantity: '10 kg',
    price: 15,
    location: 'Colombo',
    phone: '0771234567',
    description: 'Fresh organic tomatoes',
    username: 'test_user',
    seller_id: 'test_user'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'RESPONSE:', raw));
});

req.on('error', error => {
    console.error('ERROR:', error);
});

req.write(data);
req.end();
