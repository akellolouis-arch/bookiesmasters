export function calculateScores(matches) {
    if (!matches || matches.length === 0) return { total: 0, over25: 0, under25: 0 };
    
    let over25Count = 0;
    let under25Count = 0;
    
    matches.forEach(m => {
        // Handle both flattened format (m.goals) and raw API format (m.fixture.goals)
        const goalsObj = m.goals || (m.fixture && m.fixture.goals);
        if (goalsObj && typeof goalsObj.home === 'number' && typeof goalsObj.away === 'number') {
            const goals = goalsObj.home + goalsObj.away;
            if (goals > 2.5) over25Count++;
            if (goals < 2.5) under25Count++;
        }
    });
    
    return {
        total: matches.length,
        over25: over25Count,
        under25: under25Count,
    };
}

export function generateCustomBinaryPrediction(homeMatches, awayMatches) {
    // If not enough data, return NONE
    if (!homeMatches || !awayMatches || homeMatches.length < 4 || awayMatches.length < 4) {
        return "NONE";
    }

    // Only consider the last 5 matches for the prediction window
    const recentHome = homeMatches.slice(0, 5);
    const recentAway = awayMatches.slice(0, 5);

    const homeStats = calculateScores(recentHome);
    const awayStats = calculateScores(recentAway);

    const passOV15 = homeStats.over25 >= 4 && awayStats.over25 >= 4;
    const passUN35 = homeStats.under25 >= 4 && awayStats.under25 >= 4;

    if (passOV15 || passUN35) {
        return passOV15 ? "OV1.5" : "UN3.5";
    }

    return "NONE";
}
