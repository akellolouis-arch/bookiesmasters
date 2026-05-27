import axios from "axios";

async function checkFrontend() {
  try {
    const res = await axios.get("https://react-bookiesmasters.onrender.com/api/fixtures/cards?date=2026-05-27");
    const fixtures = res.data.fixtures;
    let matchIds = [];
    
    fixtures.forEach(f => {
      f.matches.forEach(m => {
        matchIds.push(m.fixtureId);
      });
    });
    
    // Check first 5
    for (let i = 0; i < Math.min(5, matchIds.length); i++) {
      const id = matchIds[i];
      try {
        const pageRes = await axios.get(`https://bookiesmasters.com/prediction/${id}`);
        console.log(`ID ${id}: ${pageRes.status}`);
      } catch (e) {
        console.log(`ID ${id}: ${e.response?.status || e.message}`);
      }
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkFrontend();
