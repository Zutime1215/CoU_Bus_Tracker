const axios = require('axios');
let allowedBusInfos = JSON.parse(process.env.ALLOWED_BUS_INFOS);

async function postToPage(msg, busId, post_id, access_token, page_id) {
    const createPostUrl = `https://graph.facebook.com/v21.0/${page_id}/feed`;
    const updatePostUrl = `https://graph.facebook.com/v21.0/${post_id}`;

    try {
        if (post_id === "0") {
            const response = await axios.post(createPostUrl, {
                message: msg,
                access_token: access_token
            });
            console.log('Success:', response.data);
            allowedBusInfos[busId].pagePostId = response.data.id;
        } else {
            const response = await axios.post(updatePostUrl, {
                message: msg,
                access_token: access_token
            });
            console.log('Success:', response.data.success);
        }
    } catch (error) {
        console.error('Error:', error.response);
    }
}

module.exports = { postToPage, allowedBusInfos };