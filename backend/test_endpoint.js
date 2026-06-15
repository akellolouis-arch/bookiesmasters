async function testEndpoint() {
    try {
        console.log("Fetching predictions for 2026-06-14...");
        const start = Date.now();
        const res = await fetch("http://localhost:5000/api/predictions/cards?date=2026-06-14");
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(`Time taken: ${Date.now() - start}ms`);
        if (data.fixtures) {
            console.log(`Returned ${data.fixtures.length} leagues`);
        } else {
            console.log(data);
        }
    } catch (e) {
        console.error(e);
    }
}

testEndpoint();
