const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// Use body-parser middleware
app.use(bodyParser.json());

const pageId = '523794520815476';
let pagePostId = '523794520815476_122097759194696098';
const pageAccessToken = 'EAAH5nG8VoZBIBO3pkgbQIdfAe3QM8aLIviUEMVPBZAuQr2mhCfQLjYAe3Q0vYBIOp58nMQ3GcV2POF2SkGYgWbVuFfkNzQBvmcUO4l34rCAvPQb3paWBJgdlEa8f1amXrrGjGaEjyRhse4nAglvnGsGSd2N8IDdyRRHHtNa0mMuZCN9S8WgY8DZCFfrVkNzmMNWXYV9qlWKHCkaz';


app.get('/makePost/:msg', (req, res) => {

    makePost(req.params['msg']);
    res.send('Post sent.');
});

app.get('/updatePost/:msg', (req, res) => {
    updatePost(req.params['msg']);
    res.send('Post Updated.');
});


function makePost(msg) {
    axios.post(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
        message: msg,
        access_token: pageAccessToken
    })
    .then(response => {
        console.log('Post ID:', response.data.id);
        pagePostId = response.data.id;
    })
    .catch(error => {
        // console.error('Error:', error.response.data);
    });
}

function updatePost(msg) {
    axios.post(`https://graph.facebook.com/v21.0/${pagePostId}`, {
        message: msg,
        access_token: pageAccessToken
    })
    .then(response => {
        console.log('Success:', response.data.success);
    })
    .catch(error => {
        // console.error('Error:', error.response.data);
    });
}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});