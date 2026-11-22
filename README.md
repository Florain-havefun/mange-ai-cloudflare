# 满格 AI · GitHub / Cloudflare 独立源码

此目录是完整的网站源码，可直接作为一个 GitHub 仓库的根目录。页面、套餐、订单登记与查询、微信号/手机号售后联系方式，以及 Session 本地解析和教程页均已保留。

## 上传哪些

上传本目录内的所有源码文件和子目录，包括隐藏文件 `.gitignore`、`.node-version`。`package.json`、`package-lock.json`、`vite.config.ts`、`wrangler.jsonc` 应位于仓库最外层。

```text
app/                       页面、样式、订单接口
components/storefront.tsx  首页与下单表单
lib/                       套餐、订单逻辑、Session 本地解析
db/                        数据库访问与表结构
drizzle/                   数据库迁移（只有结构，无客户数据）
public/                    图标等公开资源
worker/                    Cloudflare Worker 入口
scripts/                   部署配置检查
tests/                     使用虚构数据的验证脚本
package.json
package-lock.json
vite.config.ts
wrangler.jsonc
tsconfig.json
worker-configuration.d.ts   根据 Wrangler 配置生成的类型
next.config.ts
postcss.config.mjs
drizzle.config.ts
.gitignore
.node-version
README.md
DEPLOY-CLOUDFLARE.md
UPLOAD-FILES.txt
```

ZIP 用于传输和备份。若用 GitHub 网页上传，请先解压，上传里面的文件和文件夹；不要只把 ZIP 文件放进仓库。

`node_modules/`、`dist/`、`.wrangler/`、`.git/`、`.env*`、`.dev.vars*`、日志、数据库文件、浏览器登录脚本和实际 Session 均不属于上传内容。导出包已排除这些文件，后续本地生成的内容由 `.gitignore` 排除。

## 本地运行

使用 Node.js 24.22.1，首次运行：

```sh
npm ci
npm run cf:types
npm run db:local
npm run dev
```

浏览器访问 `http://localhost:5173`。`db:local` 只初始化本地模拟数据库，不需要 Cloudflare 登录。

## 部署

网站使用 React / Vinext、Cloudflare Workers 和 D1。按 [DEPLOY-CLOUDFLARE.md](DEPLOY-CLOUDFLARE.md) 创建自己的 D1 数据库、修改数据库 ID、初始化迁移，并连接 GitHub 仓库。

Cloudflare Workers 构建命令为 `npm run build`，部署命令为 `npm run deploy`。本项目包含后端接口，不配置静态 Pages 输出目录。

## 检查

```sh
npm run typecheck
npm run test:session
```

本地服务运行且本地数据库已迁移后，可在第二个终端执行 `npm run test:orders`。此检查会新增虚构测试订单，仅对本地数据库运行。

导出验证使用全新安装的依赖，已通过类型检查、独立构建、开发模式下 26 项订单接口检查、10 项 Session 解析检查及 Wrangler 发布预检（dry run）。未向你的 Cloudflare 账户实际发布。

本版本 Wrangler 的本地构建预览器在连续拒绝超大请求时曾返回 `Your worker restarted mid-request`；接口回归检查请按上文对 `npm run dev` 执行。正常下单与查询已在构建预览中验证。

## 当前业务状态

当前提供订单登记和凭证查询，尚未接入支付、实际充值或商家管理后台。订单以 `pending_confirmation` 保存，创建订单不代表付款或充值成功。

订单保存套餐、数量、邮箱及售后联系方式；查询结果隐藏部分邮箱，不返回微信号或手机号。Session 仅在浏览器本地提取邮箱，解析后清空原文，不上传或保存登录令牌。

独立部署使用你自己的全新数据库。本导出不含当前在线站点或本地测试环境的任何订单记录。

源码基于 2026-11-01 的网站版本（提交 `79e63bb21294babd4c71b9024a782dd1a2fccc30`）整理；仅在此副本中替换托管配置、精简未使用的依赖和模板文件。保留已验证的依赖版本与 `2026-05-15` 运行时兼容日期。
