const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const incomingMessage = req.body.Body;
  const from = req.body.From;

  try {
    // Send to LiveChat AI Assist
    const liveChatResponse = await axios.post(
      'https://api.livechatinc.com/v3.5/assist/ai/message',
      {
        message: incomingMessage,
        source: 'Twilio_SMS',
        visibility: 'visitor'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LIVECHAT_CLIENT_ID}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiMessage = liveChatResponse.data.reply.slice(0, process.env.MAX_SMS_LENGTH || 320);

    // Respond to Twilio
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilio.messages.create({
      body: aiMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
