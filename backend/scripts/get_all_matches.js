import axios from "axios";

async function run() {
  try {
    const res = await axios.get("http://localhost:5000/api/fixtures/1505582");
    console.log(JSON.stringify(res.data.data.homeTeam.allMatches[0], null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
run();
