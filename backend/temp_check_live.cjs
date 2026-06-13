const https = require('https');

const options = {
  hostname: 'v3.football.api-sports.io',
  path: '/fixtures?live=all',
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
      
      console.log(`Found ${response.results} live fixtures.`);
      
      const tanzaniaGames = response.response.filter(f => f.league.country === 'Tanzania');
      console.log(`\n--- Tanzania Live Games (${tanzaniaGames.length}) ---`);
      tanzaniaGames.forEach(f => {
         console.log(`ID: ${f.fixture.id} | ${f.teams.home.name} ${f.goals.home}-${f.goals.away} ${f.teams.away.name} | Status: ${f.fixture.status.short} | Minute: ${f.fixture.status.elapsed}`);
      });
      
      const kmsGames = response.response.filter(f => f.teams.home.name.toLowerCase().includes('kms') || f.teams.away.name.toLowerCase().includes('kms') || f.teams.home.name.toLowerCase().includes('kmc') || f.teams.away.name.toLowerCase().includes('kmc') || f.teams.home.name.toLowerCase().includes('dabora') || f.teams.away.name.toLowerCase().includes('dabora'));
      console.log(`\n--- Matches matching KMS/KMC/Dabora (${kmsGames.length}) ---`);
      kmsGames.forEach(f => {
         console.log(`ID: ${f.fixture.id} | ${f.teams.home.name} ${f.goals.home}-${f.goals.away} ${f.teams.away.name} | Status: ${f.fixture.status.short} | Minute: ${f.fixture.status.elapsed}`);
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
