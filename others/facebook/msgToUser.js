const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// Use body-parser middleware
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAGW9C8Ez9MBO122aVZBg4ZBPsf4tkZCYtnSNgbR3SSERQzDGZCCBfAQjoEsqbqjGCJ8r7IFo7isNz8lyXji0tIm83IRfi7UP2oemEwZApRqWDMdNZBCFWoR5ZBrDRZAZA9hTiQ2EwDYVyPm8Po2TjsFJZCbKXcJMgdgZArlTOBPRp4GZArLhqwOPSu57JA9i5bWYaZCFPhXz1pX2UkSuWZBsxXgZDZD';
const USER_ID = '27911974555116180';

// Webhook event handler
app.post('/webhook', (req, res) => {
    console.log(req.body);
    res.status(200).send('Message sent manually.');
});

app.get('/send-message', (req, res) => {
    const message = `Manual GPS Update:\nLatitude: ${23.418514}\nLongitude: ${91.134230}\nTime: ${new Date().toLocaleTimeString()}`;
    sendTextMessage(message);
    res.send('Message sent manually.');
});

function sendTextMessage(text) {
    const messageData = {
        recipient: { id: USER_ID },
        message: { text: text },
    };

    axios
        .post(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, messageData)
        .then(response => {
            console.log('Message sent successfully:', response.data);
        })
        .catch(error => {
            console.error('Error sending message:', error.response.data);
        });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});