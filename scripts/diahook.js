const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const open = require('open');

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

axios.post(
  "https://api.clerk.dev/v1/webhooks/diahook_url",
  {},
  { headers: { Authorization: `Bearer ${process.env.CLERK_API_KEY}` } }
).then((r) => open(r.data.diahook_url));
