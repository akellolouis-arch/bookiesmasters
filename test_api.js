async function test() {
  try {
    const res = await fetch("http://localhost:5000/api/predictions/cards?date=2026-06-05");
    if (!res.ok) {
        console.log("Error status:", res.status);
        const text = await res.text();
        console.log("Response text:", text);
        return;
    }
    const data = await res.json();
    console.log("Total Leagues:", data.totalLeagues);
    if (data.fixtures && data.fixtures.length > 0) {
        console.log("Matches in first league:", data.fixtures[0].matches.length);
        console.log("First match name:", data.fixtures[0].matches[0].homeTeam.name, "vs", data.fixtures[0].matches[0].awayTeam.name);
    }
  } catch (err) {
    console.error(err);
  }
}

test();
