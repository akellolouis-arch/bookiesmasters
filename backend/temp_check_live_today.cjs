const https = require('https');

const todayStr = new Date().toISOString().split('T')[0];

const options = {
  hostname: 'v3.football.api-sports.io',
  path: `/fixtures?date=${todayStr}`,
  method: 'GET',
  headers: {
    'x-apisports-key': '5baf95f049ec8c2ebf0a98dcfacee930'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.errors && Object.keys(response.errors).length > 0) {
        console.error("API Errors:", response.errors);
        return;
      }
      
      const kmsGames = response.response.filter(f => f.teams.home.name.toLowerCase().includes('kmc') || f.teams.away.name.toLowerCase().includes('kmc') || f.teams.home.name.toLowerCase().includes('tabora') || f.teams.away.name.toLowerCase().includes('tabora') || f.teams.home.name.toLowerCase().includes('dabora'));
      console.log(`\n--- Matches matching KMC/Tabora/Dabora for today (${kmsGames.length}) ---`);
      kmsGames.forEach(f => {
         console.log(`ID: ${f.fixture.id} | ${f.teams.home.name} ${f.goals.home}-${f.goals.away} ${f.teams.away.name} | Status: ${f.fixture.status.short} (${f.fixture.status.long}) | Minute: ${f.fixture.status.elapsed} | Time: ${f.fixture.date}`);
      });

    } catch (err) {
      console.error("Failed to parse response:", err);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
