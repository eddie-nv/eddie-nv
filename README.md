# Eduardo Nava-Valencia

**Full-Stack Engineer** · San Francisco, CA

Building AI-powered tools and agent infrastructure. Bootcamp grad with production experience shipping full-stack systems.

📍 San Francisco · ✉️ ed.nava.valencia@gmail.com · [Portfolio](https://www.ed-nava-valencia.com) · [LinkedIn](https://www.linkedin.com/in/ed-nava-valencia/)

---

## Experience

**Full-Stack Engineer** · Connect For Purpose · *Nov 2024 – May 2025*

Migrated a large-scale legacy platform from 4D to a Node.js / React / PostgreSQL stack. Wrote endpoint tests validating parity between legacy and new system responses. Applied WCAG accessibility patterns across React components. Contributed to architecture discussions and technical documentation.
`Node.js` `React` `Jest` `PostgreSQL`

**Full-Stack Engineer** · TouchStone · *Oct 2023 – Apr 2024*

Reduced average query response time from 3,500ms to 74ms through SQL indexing and denormalization. Architected a load balancer to handle 10k RPM, with Redis caching cutting response times by 40%+ under heavy traffic. Built interactive UI features in React.
`Next.js` `Express` `PostgreSQL` `AWS` `NginX` `Redis`

---

## Projects

### Chef Zeff · *Founder & Engineer · 2025 – Present*

Production-ready AI cooking assistant. Scrapes live grocery store inventory to ground recipe generation in real, purchasable ingredients.

- Semantic caching via HNSW cosine similarity: sub-100ms hits vs 30s fresh LLM generation, 92% cache hit rate
- Agent memory in Redis JSON with TTL; long-term memory in RedisVL with hybrid vector + BM25 search across five types
- Server-side recency boosting via Redis APPLY expressions, zero round trips
- Ingredient deduplication via embedding similarity (0.05 cosine distance threshold) keeps the knowledge base clean across scraped sources

`Redis` `Next.js` `PostgreSQL` `LangChain` `Docker` `TypeScript`

### [Baton](https://github.com/eddie-nv/baton) · *2025*

State fabric for coding agents. MCP server that lets a Claude Code or Cursor session resume mid-sentence after a laptop close, branch switch, or hand-off.

- Hard-capped token budgets (500-token FeatureCard, 1,500-token ResumePacket) enforced exactly via `js-tiktoken` at the write boundary
- Append-only event stream on Redis Streams, deterministic compaction into a structured handoff packet
- Stdio MCP shim works with Claude Code, Cursor, Codex, Claude Desktop, Windsurf

`TypeScript` `MCP` `Redis` `Hono` `React`

---

## Stack

**Languages** JavaScript (ES6+), TypeScript, SQL, HTML, CSS
**Frontend** React, Next.js, React Native / Expo, Mantine UI, Webpack, Babel
**Backend** Node.js, Express, PostgreSQL, MongoDB, Redis, REST APIs
**AI / LLM** LangChain, Claude Code, MCP, multi-agent pipelines, prompt engineering
**DevOps** Git, Docker, CI/CD, AWS (EC2, S3), GCP, NginX, Render, Jest, ESLint

---

## Education

**Hack Reactor** · Advanced Software Engineering Immersive · *Jun 2025 – Sept 2025*
500+ hours of pair programming, algorithms, full-stack, and AI application development.

---

<p align="center">
  <a href="https://git.io/streak-stats">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://streak-stats.demolab.com?user=eddie-nv&theme=black-ice&hide_border=true&short_numbers=true&background=00000000" />
      <source media="(prefers-color-scheme: light)" srcset="https://streak-stats.demolab.com?user=eddie-nv&theme=default&hide_border=true&short_numbers=true&background=00000000" />
      <img src="https://streak-stats.demolab.com?user=eddie-nv&theme=black-ice&hide_border=true&short_numbers=true&background=00000000" alt="GitHub Streak" />
    </picture>
  </a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/eddie-nv/eddie-nv/output-3d/profile-night-view.svg" alt="3D contribution graph" />
</p>

<p align="center">
  <a href="https://x.com/e_nava_valencia">X</a> ·
  <a href="https://www.linkedin.com/in/ed-nava-valencia/">LinkedIn</a> ·
  <a href="https://www.ed-nava-valencia.com">Portfolio</a>
</p>
