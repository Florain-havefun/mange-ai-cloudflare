import { readFileSync, existsSync } from "node:fs";

// This configuration uses plain JSON syntax, so it needs no JSONC dependency.
const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const binding = config.d1_databases?.find(item => item.binding === "DB");
const id = binding?.database_id;
if (!id || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id) || id === "00000000-0000-4000-8000-000000000000") {
  console.error("请先创建自己的 Cloudflare D1 数据库，并将 wrangler.jsonc 中的 database_id 替换为真实 UUID。详见 DEPLOY-CLOUDFLARE.md。");
  process.exit(1);
}
const output = new URL("../dist/server/wrangler.json", import.meta.url);
if (existsSync(output)) {
  const built = JSON.parse(readFileSync(output, "utf8"));
  const builtDb = built.d1_databases?.find(item => item.binding === "DB");
  if (builtDb?.database_id !== id || built.name !== config.name) {
    console.error("构建中的数据库配置或 Worker 名称已过期，请先重新执行 npm run build。");
    process.exit(1);
  }
}
