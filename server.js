import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "black_sheep"; // you choose this yourself

// ✅ Webhook verification (Meta will call this once)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 📩 Handle incoming WhatsApp messages
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const messages = changes?.value?.messages;

  if (messages && messages.length > 0) {
    const msg = messages[0];
    const from = msg.from; // user's WhatsApp number
    const text = msg.text?.body || "Hello 👋";

    console.log(`📥 Message from ${from}: ${text}`);

    await sendReply(from, `You said: ${text}`);
  }

  res.sendStatus(200);
});

// ✉️ Send a reply via WhatsApp Cloud API
async function sendReply(to, message) {
  const TOKEN = process.env.WHATSAPP_TOKEN; // We'll set this in hosting later
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
