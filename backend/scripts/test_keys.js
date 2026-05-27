import axios from "axios";

async function checkFrontend() {
  try {
    const res = await axios.get("https://react-bookiesmasters.onrender.com/api/fixtures/cards?date=2026-05-27");
    const fixtures = res.data.fixtures;
    
    console.log(fixtures[0].matches[0]);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkFrontend();
