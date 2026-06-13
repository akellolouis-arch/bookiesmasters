

async function testEndpoint() {
    const KENYA_TZ = "Africa/Nairobi";
    const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: KENYA_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const todayYmd = kenyaYmdFormatter.format(new Date());

    try {
        console.log(`Fetching from http://localhost:5000/api/predictions/cards?date=${todayYmd}...`);
        const res = await fetch(`http://localhost:5000/api/predictions/cards?date=${todayYmd}`);
        if (!res.ok) {
            console.error(`HTTP error! status: ${res.status}`);
            return;
        }
        const data = await res.json();
        let matchCount = 0;
        if (data.fixtures) {
            data.fixtures.forEach(f => matchCount += f.matches.length);
        }
        console.log(`Endpoint returned ${matchCount} predicted matches.`);
    } catch (e) {
        console.error("Error fetching from localhost:5000:", e.message);
    }
}
testEndpoint();
