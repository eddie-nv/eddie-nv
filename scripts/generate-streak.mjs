#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";

const TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN;
const USERNAME = process.env.USERNAME || "eddie-nv";
const OUT_DIR = "dist-streak";

if (!TOKEN) {
  console.error("GITHUB_TOKEN (or GH_PAT) env var is required");
  process.exit(1);
}

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "eddie-nv-streak-generator",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function getCreatedAt(login) {
  const data = await gql(`query($login:String!){user(login:$login){createdAt}}`, { login });
  return new Date(data.user.createdAt);
}

async function getDays(login, from, to) {
  const data = await gql(
    `query($login:String!,$from:DateTime!,$to:DateTime!){
       user(login:$login){
         contributionsCollection(from:$from,to:$to){
           contributionCalendar{
             weeks{contributionDays{date contributionCount}}
           }
         }
       }
     }`,
    { login, from: from.toISOString(), to: to.toISOString() },
  );
  return data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays);
}

async function fetchAllDays(login) {
  const created = await getCreatedAt(login);
  const today = new Date();
  const days = new Map();
  let from = new Date(created);
  while (from < today) {
    const to = new Date(from);
    to.setUTCFullYear(to.getUTCFullYear() + 1);
    if (to > today) to.setTime(today.getTime());
    for (const d of await getDays(login, from, to)) {
      days.set(d.date, d.contributionCount);
    }
    from = new Date(to);
    from.setUTCDate(from.getUTCDate() + 1);
  }
  return [...days.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function computeStats(days) {
  let total = 0;
  let longest = 0, longestStart = null, longestEnd = null;
  let runStart = null, runLen = 0;
  for (const { date, count } of days) {
    total += count;
    if (count > 0) {
      if (runLen === 0) runStart = date;
      runLen++;
      if (runLen > longest) { longest = runLen; longestStart = runStart; longestEnd = date; }
    } else {
      runLen = 0; runStart = null;
    }
  }
  let currentStreak = 0, currentStart = null, currentEnd = null;
  const todayStr = new Date().toISOString().slice(0, 10);
  let i = days.length - 1;
  if (i >= 0 && days[i].date === todayStr && days[i].count === 0) i--;
  while (i >= 0 && days[i].count > 0) {
    if (currentEnd === null) currentEnd = days[i].date;
    currentStart = days[i].date;
    currentStreak++;
    i--;
  }
  return {
    total, currentStreak, currentStart, currentEnd,
    longest, longestStart, longestEnd,
    firstDate: days[0]?.date, lastDate: days[days.length - 1]?.date,
  };
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function shortNum(n) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, "") + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

function renderSVG(stats, mode) {
  const dark = mode === "dark";
  // black-ice palette: ring/fire/currStreakLabel = #00E7FF (cyan)
  // dark mode: white nums/labels; light mode: black nums/labels (matches user's URL overrides)
  const numColor = dark ? "#FFFFFF" : "#000000";
  const labelColor = dark ? "#FFFFFF" : "#000000";
  const dateColor = "#9F9F9F";
  const ringColor = "#00E7FF";
  const currLabel = "#00E7FF";
  const fireColor = "#00E7FF";
  const stroke = dark ? "#E4E2E2" : "#9F9F9F";
  const T = (n) => shortNum(n);
  const totalNum = T(stats.total);
  const currNum = T(stats.currentStreak);
  const longNum = T(stats.longest);
  const totalRange = `${fmtDate(stats.firstDate)} - Present`;
  const currRange = stats.currentStreak > 0
    ? `${fmtDate(stats.currentStart)} - ${fmtDate(stats.currentEnd)}`
    : "—";
  const longRange = stats.longest > 0
    ? `${fmtDate(stats.longestStart)} - ${fmtDate(stats.longestEnd)}`
    : "—";

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="isolation:isolate" viewBox="0 0 555 195" width="555px" height="195px">
  <style>
    @keyframes currstreak { 0%{font-size:3px;opacity:.2} 80%{font-size:34px;opacity:1} 100%{font-size:28px;opacity:1} }
    @keyframes fadein { 0%{opacity:0} 100%{opacity:1} }
  </style>
  <defs>
    <mask id="mask_out_ring_behind_fire">
      <rect width="555" height="195" fill="white"/>
      <ellipse cx="277.5" cy="32" rx="13" ry="18" fill="black"/>
    </mask>
  </defs>

  <line x1="185" y1="28" x2="185" y2="170" vector-effect="non-scaling-stroke" stroke-width="1" stroke="${stroke}" stroke-linejoin="miter" stroke-linecap="square" stroke-miterlimit="3"/>
  <line x1="370" y1="28" x2="370" y2="170" vector-effect="non-scaling-stroke" stroke-width="1" stroke="${stroke}" stroke-linejoin="miter" stroke-linecap="square" stroke-miterlimit="3"/>

  <g transform="translate(92.5, 48)">
    <text x="0" y="32" text-anchor="middle" fill="${numColor}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700" font-size="28px" style="opacity:0;animation:fadein .5s linear forwards .6s">${totalNum}</text>
  </g>
  <g transform="translate(92.5, 84)">
    <text x="0" y="32" text-anchor="middle" fill="${labelColor}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="400" font-size="14px" style="opacity:0;animation:fadein .5s linear forwards .7s">Total Contributions</text>
  </g>
  <g transform="translate(92.5, 114)">
    <text x="0" y="32" text-anchor="middle" fill="${dateColor}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="400" font-size="12px" style="opacity:0;animation:fadein .5s linear forwards .8s">${totalRange}</text>
  </g>

  <g transform="translate(277.5, 108)">
    <text x="0" y="32" text-anchor="middle" fill="${currLabel}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700" font-size="14px" style="opacity:0;animation:fadein .5s linear forwards .9s">Current Streak</text>
  </g>
  <g transform="translate(277.5, 145)">
    <text x="0" y="21" text-anchor="middle" fill="${dateColor}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="400" font-size="12px" style="opacity:0;animation:fadein .5s linear forwards .9s">${currRange}</text>
  </g>
  <g mask="url(#mask_out_ring_behind_fire)">
    <circle cx="277.5" cy="71" r="40" fill="none" stroke="${ringColor}" stroke-width="5" style="opacity:0;animation:fadein .5s linear forwards .4s"/>
  </g>
  <g transform="translate(277.5, 19.5)" stroke-opacity="0" style="opacity:0;animation:fadein .5s linear forwards .6s">
    <path d="M -12 -0.5 L 15 -0.5 L 15 23.5 L -12 23.5 L -12 -0.5 Z" fill="none"/>
    <path d="M 1.5 0.67 C 1.5 0.67 2.24 3.32 2.24 5.47 C 2.24 7.53 0.89 9.2 -1.17 9.2 C -3.23 9.2 -4.79 7.53 -4.79 5.47 L -4.76 5.11 C -6.78 7.51 -8 10.62 -8 13.99 C -8 18.41 -4.42 22 0 22 C 4.42 22 8 18.41 8 13.99 C 8 8.6 5.41 3.79 1.5 0.67 Z M -0.29 19 C -2.07 19 -3.51 17.6 -3.51 15.86 C -3.51 14.24 -2.46 13.1 -0.7 12.74 C 1.07 12.38 2.9 11.53 3.92 10.16 C 4.31 11.45 4.51 12.81 4.51 14.2 C 4.51 16.85 2.36 19 -0.29 19 Z" fill="${fireColor}" stroke-opacity="0"/>
  </g>
  <g transform="translate(277.5, 48)">
    <text x="0" y="32" text-anchor="middle" fill="${numColor}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700" font-size="28px" style="animation:currstreak .6s linear forwards">${currNum}</text>
  </g>

  <g transform="translate(462.5, 48)">
    <text x="0" y="32" text-anchor="middle" fill="${numColor}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700" font-size="28px" style="opacity:0;animation:fadein .5s linear forwards 1.2s">${longNum}</text>
  </g>
  <g transform="translate(462.5, 84)">
    <text x="0" y="32" text-anchor="middle" fill="${labelColor}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="400" font-size="14px" style="opacity:0;animation:fadein .5s linear forwards 1.3s">Longest Streak</text>
  </g>
  <g transform="translate(462.5, 114)">
    <text x="0" y="32" text-anchor="middle" fill="${dateColor}" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="400" font-size="12px" style="opacity:0;animation:fadein .5s linear forwards 1.4s">${longRange}</text>
  </g>
</svg>`;
}

(async () => {
  console.log(`Fetching contributions for ${USERNAME}...`);
  const days = await fetchAllDays(USERNAME);
  const stats = computeStats(days);
  console.log("Stats:", stats);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}/streak-dark.svg`, renderSVG(stats, "dark"));
  writeFileSync(`${OUT_DIR}/streak-light.svg`, renderSVG(stats, "light"));
  console.log(`Wrote ${OUT_DIR}/streak-dark.svg and streak-light.svg`);
})().catch((err) => { console.error(err); process.exit(1); });
