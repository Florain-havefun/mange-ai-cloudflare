# GitHub 上传与 Cloudflare Workers 部署

## 1. 上传 GitHub

新建一个空仓库，例如 `mange-ai`。上传本目录内所有文件和文件夹，使 `package.json` 与 `wrangler.jsonc` 直接位于仓库根目录。完整清单见 `UPLOAD-FILES.txt`。

若使用 Git 命令，在本目录打开终端，执行下面的命令。最后一行中的仓库地址改成你自己的 GitHub 仓库地址；GitHub 登录由 Git 自身处理。

```sh
git init -b main
git add .
git commit -m "Initial website source"
git remote add origin https://github.com/YOUR_USERNAME/mange-ai.git
git push -u origin main
```

## 2. 创建自己的 D1 数据库

在 Cloudflare 的 D1 页面创建数据库，名称建议为 `mange-ai-orders`。复制该数据库的 Database ID，修改仓库里的 `wrangler.jsonc`：

```json
{
  "binding": "DB",
  "database_name": "mange-ai-orders",
  "database_id": "这里替换成你创建的数据库的 UUID",
  "migrations_dir": "drizzle"
}
```

只替换实际配置中的 `database_id`，不要把上面的整个片段当作完整配置文件。`binding` 保持 `DB`。如你使用不同数据库名，也同步修改 `database_name`。

初始 `00000000-0000-4000-8000-000000000000` 仅供本地测试。部署检查会要求你先替换它。

## 3. 初始化线上数据库

在本目录打开终端：

```sh
npm ci
npx wrangler login
npm run db:remote
```

按 Wrangler 提示登录你自己的 Cloudflare 账号，确认执行迁移。迁移创建订单表与索引，记录已应用的版本；以后再次运行只应用尚未执行的迁移。请使用上一步新建的空数据库。

如果账号属于多个 Cloudflare 账户，在 `wrangler.jsonc` 顶层添加对应的 `account_id`，或在执行命令的环境中设置 `CLOUDFLARE_ACCOUNT_ID`。账户 ID 和数据库 ID 是配置标识，不是 API Token。

将修改后的 `wrangler.jsonc` 提交并推送到 GitHub。不要上传登录令牌、API Token、Session 或本地数据库文件。

## 4. 连接 Cloudflare 与 GitHub

在 Cloudflare 的 **Workers & Pages** 中创建 Worker，选择连接 GitHub 仓库；也可在已有 Worker 的 **Settings → Builds → Connect** 连接仓库。

| 设置 | 填写值 |
| --- | --- |
| Worker 名称 | `mange-ai`，必须与 `wrangler.jsonc` 的 `name` 一致 |
| 生产分支 | `main` |
| 根目录 | 仓库根目录（留空或 `/`） |
| 构建命令 | `npm run build` |
| 部署命令 | `npm run deploy` |
| Node.js 版本 | `24.22.1`，可设置构建变量 `NODE_VERSION` |

依赖由 Cloudflare 根据 `package-lock.json` 安装。若你的构建设置需要显式安装步骤，可将构建命令填为 `npm ci && npm run build`。

这是 **Workers 项目**。不要选择仅上传静态目录的 Pages 模式，不需要填写 Pages 的输出目录。Vite 会生成用于发布的 Worker 与静态资源配置，Wrangler 自动读取该构建配置。

若上传时保留了外层文件夹，而非把内容放在仓库根目录，将根目录改成那层文件夹路径。推荐直接使用根目录布局。

首次部署成功后使用 Cloudflare 返回的 `workers.dev` 地址。后续向 `main` 推送提交会触发构建发布。已有 Worker 的域名可在 Cloudflare 的域名设置中配置。

## 可选：在本地发布

已完成登录和数据库迁移后：

```sh
npm run build
npm run deploy
```

修改数据库 ID 或 Worker 名称后，请重新构建再部署。部署脚本会检测已构建配置是否过期。

## 本地构建预览

```sh
npm run db:local
npm run build
npm run preview
```

访问 `http://localhost:8787`。本地数据库与线上数据库相互独立。

## 参考文档

- [Cloudflare Workers 的 GitHub 构建部署设置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare Workers Git 仓库连接](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [D1 数据库迁移](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare 的 Next.js / Vinext 指南](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
