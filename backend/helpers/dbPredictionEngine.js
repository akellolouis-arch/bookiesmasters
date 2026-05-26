export function calculateScores(matches) {
    if (!matches || matches.length === 0) return { ov15: 0, un35: 0, avgGoals: 0 };
    
    let ov15Count = 0;
    let un35Count = 0;
    
    matches.forEach(m => {
        // Handle both flattened format (m.goals) and raw API format (m.fixture.goals)
        const goalsObj = m.goals || (m.fixture && m.fixture.goals);
        if (goalsObj && typeof goalsObj.home === 'number' && typeof goalsObj.away === 'number') {
            const goals = goalsObj.home + goalsObj.away;
            if (goals >= 2) ov15Count++;
            if (goals <= 3) un35Count++;
        }
    });
    
    return {
        ov15: ov15Count / matches.length,
        un35: un35Count / matches.length,
        avgGoals: matches.reduce((acc, m) => {
            const goalsObj = m.goals || (m.fixture && m.fixture.goals);
            if (goalsObj && typeof goalsObj.home === 'number' && typeof goalsObj.away === 'number') {
                return acc + goalsObj.home + goalsObj.away;
            }
            return acc;
        }, 0) / matches.length
    };
}

export function generateCustomBinaryPrediction(homeMatches, awayMatches) {
    // If not enough data, default to UN3.5 as a safe fallback
    if (!homeMatches || !awayMatches || homeMatches.length < 3 || awayMatches.length < 3) {
        return "UN3.5";
    }

    // Only consider the last 10 matches for the prediction window
    const recentHome = homeMatches.slice(0, 10);
    const recentAway = awayMatches.slice(0, 10);

    const homeStats = calculateScores(recentHome);
    const awayStats = calculateScores(recentAway);

    const combinedOv15 = (homeStats.ov15 + awayStats.ov15) / 2;
    const combinedUn35 = (homeStats.un35 + awayStats.un35) / 2;

    if (combinedOv15 > combinedUn35) {
        return "OV1.5";
    } else if (combinedUn35 > combinedOv15) {
        return "UN3.5";
    } else {
        // Tie breaker
        const combinedAvgGoals = (homeStats.avgGoals + awayStats.avgGoals) / 2;
        if (combinedAvgGoals > 2.5) {
            return "OV1.5";
        } else {
            return "UN3.5";
        }
    }
}
