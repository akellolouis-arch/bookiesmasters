import { execSync } from 'child_process';

function runAll() {
    const dates = [];
    const now = new Date();
    for (let i = -7; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        dates.push(d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }));
    }

    for (const date of dates) {
        console.log(`\n--- Starting ${date} ---`);
        try {
            execSync(`node precalculate_one.js ${date}`, { stdio: 'inherit' });
        } catch (e) {
            console.error(`Failed on ${date}`);
        }
    }
}

runAll();
