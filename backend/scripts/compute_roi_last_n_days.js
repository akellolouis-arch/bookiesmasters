import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";
import { formatFixtureCard } from "../helpers/fixtureFormatter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function getDatePlus(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function pickResultFromGoals(goalsHome, goalsAway) {
  if (goalsHome == null || goalsAway == null) return null;
  if (goalsHome > goalsAway) return "1";
  if (goalsHome < goalsAway) return "2";
  return "X";
}

function parseOdd(x) {
  if (x == null) return null;
  const n = Number(x);
  return Number.isFinite(n) && n > 1 ? n : null;
}

function estDoubleChanceOddFrom1X2(homeOdd, drawOdd, awayOdd, market) {
  // Estimate double-chance decimal odds from 1X2 odds by:
  // 1) Convert to implied probs p=1/odd
  // 2) Normalize to remove overround
  // 3) Combine probs for DC
  const h = parseOdd(homeOdd);
  const d = parseOdd(drawOdd);
  const a = parseOdd(awayOdd);
  if (!h || !d || !a) return null;

  const ph = 1 / h;
  const pd = 1 / d;
  const pa = 1 / a;
  const sum = ph + pd + pa;
  if (sum <= 0) return null;

  const nh = ph / sum;
  const nd = pd / sum;
  const na = pa / sum;

  let p;
  if (market === "1X") p = nh + nd;
  else if (market === "X2") p = nd + na;
  else return null;

  if (p <= 0) return null;
  return 1 / p;
}

function profitForBet(win, odd, stake = 1) {
  // Decimal odds: payout = stake*odd on win, else 0. Profit = payout - stake.
  if (!odd) return null;
  return (win ? stake * odd : 0) - stake;
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
  await mongoose.connect(MONGO_URI);

  const days = Number(process.env.DAYS || "30");
  const stake = Number(process.env.STAKE || "1");
  const startOffset = -1;
  const endOffset = -days;

  const overall = {
    exact: { bets: 0, stake: 0, profit: 0 }, // only 1/2 where we have direct odds
    estimated: { bets: 0, stake: 0, profit: 0 }, // includes 1X/X2 using derived odds
  };

  const byTip = {
    exact: {},
    estimated: {},
  };

  for (let offset = startOffset; offset >= endOffset; offset--) {
    const date = getDatePlus(offset);
    const start = new Date(`${date}T00:00:00.000Z`).toISOString();
    const end = new Date(`${date}T23:59:59.999Z`).toISOString();

    // eslint-disable-next-line no-await-in-loop
    const docs = await Fixture.find({
      "fixture.fixture.date": { $gte: start, $lte: end },
      "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
    }).lean();

    for (const d of docs) {
      const card = formatFixtureCard(d);
      const tip = card.prediction;
      if (!tip || tip === "N/A") continue;

      const g = d.fixture?.goals;
      const result = pickResultFromGoals(g?.home, g?.away);
      if (!result) continue;

      const o = card.odds;
      const homeOdd = parseOdd(o?.home);
      const drawOdd = parseOdd(o?.draw);
      const awayOdd = parseOdd(o?.away);

      let win = null;
      if (tip === "1") win = result === "1";
      else if (tip === "2") win = result === "2";
      else if (tip === "1X") win = result === "1" || result === "X";
      else if (tip === "X2") win = result === "X" || result === "2";
      else continue;

      // Exact ROI only for 1/2 tips with direct odds available
      if (tip === "1" && homeOdd) {
        const p = profitForBet(win, homeOdd, stake);
        if (p != null) {
          overall.exact.bets += 1;
          overall.exact.stake += stake;
          overall.exact.profit += p;
          byTip.exact[tip] ??= { bets: 0, stake: 0, profit: 0 };
          byTip.exact[tip].bets += 1;
          byTip.exact[tip].stake += stake;
          byTip.exact[tip].profit += p;
        }
      } else if (tip === "2" && awayOdd) {
        const p = profitForBet(win, awayOdd, stake);
        if (p != null) {
          overall.exact.bets += 1;
          overall.exact.stake += stake;
          overall.exact.profit += p;
          byTip.exact[tip] ??= { bets: 0, stake: 0, profit: 0 };
          byTip.exact[tip].bets += 1;
          byTip.exact[tip].stake += stake;
          byTip.exact[tip].profit += p;
        }
      }

      // Estimated ROI: 1/2 use direct odds; 1X/X2 use derived odds from 1X2
      let usedOdd = null;
      if (tip === "1") usedOdd = homeOdd;
      else if (tip === "2") usedOdd = awayOdd;
      else if (tip === "1X") usedOdd = estDoubleChanceOddFrom1X2(homeOdd, drawOdd, awayOdd, "1X");
      else if (tip === "X2") usedOdd = estDoubleChanceOddFrom1X2(homeOdd, drawOdd, awayOdd, "X2");

      if (usedOdd) {
        const p = profitForBet(win, usedOdd, stake);
        if (p != null) {
          overall.estimated.bets += 1;
          overall.estimated.stake += stake;
          overall.estimated.profit += p;
          byTip.estimated[tip] ??= { bets: 0, stake: 0, profit: 0 };
          byTip.estimated[tip].bets += 1;
          byTip.estimated[tip].stake += stake;
          byTip.estimated[tip].profit += p;
        }
      }
    }
  }

  const roi = (profit, st) => (st ? (profit / st) * 100 : 0);

  console.log(`DAYS=${days} STAKE=${stake}`);
  console.log("--- EXACT ROI (only 1/2 where odds exist) ---");
  console.log(
    `BETS=${overall.exact.bets} STAKE=${overall.exact.stake.toFixed(2)} PROFIT=${overall.exact.profit.toFixed(2)} ROI=${roi(overall.exact.profit, overall.exact.stake).toFixed(2)}%`
  );
  console.log("BY_TIP_EXACT=" + JSON.stringify(byTip.exact, null, 2));

  console.log("--- ESTIMATED ROI (includes 1X/X2 derived from 1X2 odds) ---");
  console.log(
    `BETS=${overall.estimated.bets} STAKE=${overall.estimated.stake.toFixed(2)} PROFIT=${overall.estimated.profit.toFixed(2)} ROI=${roi(overall.estimated.profit, overall.estimated.stake).toFixed(2)}%`
  );
  console.log("BY_TIP_ESTIMATED=" + JSON.stringify(byTip.estimated, null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

