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
  const numColor = dark ? "#FFFFFF" : "#000000";
  const labelColor = dark ? "#A4D0E4" : "#000000";
  const dateColor = dark ? "#A4D0E4" : "#000000";
  const ringColor = dark ? "#39FF14" : "#000000";
  const currLabel = dark ? "#39FF14" : "#000000";
  const fireColor = "#FF6B35";
  const divider = dark ? "rgba(164,208,228,0.25)" : "rgba(0,0,0,0.2)";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195" fill="none" font-family="Segoe UI, Ubuntu, sans-serif">
  <line x1="165" y1="28" x2="165" y2="170" stroke="${divider}" stroke-width="1"/>
  <line x1="330" y1="28" x2="330" y2="170" stroke="${divider}" stroke-width="1"/>
  <g transform="translate(82.5, 70)">
    <text text-anchor="middle" y="0" fill="${numColor}" font-weight="700" font-size="28">${shortNum(stats.total)}</text>
    <text text-anchor="middle" y="25" fill="${labelColor}" font-weight="400" font-size="14">Total Contributions</text>
    <text text-anchor="middle" y="80" fill="${dateColor}" font-weight="400" font-size="12">${fmtDate(stats.firstDate)} – Present</text>
  </g>
  <g transform="translate(247.5, 70)">
    <circle cx="0" cy="-15" r="40" fill="none" stroke="${ringColor}" stroke-width="1.5"/>
    <text text-anchor="middle" y="0" fill="${numColor}" font-weight="700" font-size="28">${shortNum(stats.currentStreak)}</text>
    <text text-anchor="middle" y="25" fill="${currLabel}" font-weight="700" font-size="14">Current Streak</text>
    <text text-anchor="middle" y="80" fill="${dateColor}" font-weight="400" font-size="12">${fmtDate(stats.currentStart)} – ${fmtDate(stats.currentEnd)}</text>
    <path transform="translate(-9, -68)" d="M9 0c-1 4-3 5-5 8c-2 3-1 7 1 9c-2-3 0-6 3-7c-1 3 1 6 4 6c3 0 5-3 5-6c0-4-4-7-8-10z" fill="${fireColor}"/>
  </g>
  <g transform="translate(412.5, 70)">
    <text text-anchor="middle" y="0" fill="${numColor}" font-weight="700" font-size="28">${shortNum(stats.longest)}</text>
    <text text-anchor="middle" y="25" fill="${labelColor}" font-weight="400" font-size="14">Longest Streak</text>
    <text text-anchor="middle" y="80" fill="${dateColor}" font-weight="400" font-size="12">${fmtDate(stats.longestStart)} – ${fmtDate(stats.longestEnd)}</text>
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
