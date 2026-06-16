db.fixtures.find({ 
    date: /2026-06-15/, 
    $or: [{'teams.home.name': /simba/i}, {'teams.away.name': /simba/i}, {'teams.home.name': /singida/i}, {'teams.away.name': /singida/i}] 
}, { 'fixture.id': 1, 'teams': 1, 'fixture.status.short': 1, 'fixture.date': 1 }).toArray();
