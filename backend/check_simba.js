import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: './.env' });

async function checkApi() {
  try {
    const res = await axios.get("https://v3.football.api-sports.io/fixtures", {
      params: { id: 1477273 },
      headers: { "x-apisports-key": process.env.API_KEY }
    });
    console.log("API Status:", res.data.response[0].fixture.status);
    console.log("API Date:", res.data.response[0].fixture.date);
    console.log("Goals:", res.data.response[0].goals);
  } catch (err) {
    console.error(err);
  }
}

checkApi();
