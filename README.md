# AIFA (aifa.one) 克隆

一个把 aifa.one 的版式与功能重建为**自研代码**的全栈演示站：

- **后端** Go 1.23（`net/http` ServeMux + pgx/v5 + go-redis/v9）
- **存储** PostgreSQL 16（迁移 + 演示数据）、Redis 7（会话、限流、浏览计数）
- **前端** Next.js 16 App Router + React 19 + TypeScript + 手写全局 CSS（无 UI 框架）
- **登录** 邮箱一次性验证码（OTP），无密码；会话写 Redis，HttpOnly Cookie 下发
- **文案与图片** 全部为本项目自撰的演示内容与自制 SVG 占位图，未复制原站文章、图片或字体

## 目录

```
docker-compose.yml     postgres:16-alpine + redis:7-alpine
backend/
  cmd/server/          入口、路由装配
  internal/            config / db / cache / auth / middleware / model / store / handler
  migrations/          0001–0004 SQL：schema + 演示种子数据
frontend/
  app/                 路由（首页 / 专栏 / 研究 / 学院 / 出海 / 关于 / 书架 / 登录 / 阅读器）
  components/          Masthead、HomeScreen、Reader、Shelf、Consult 等
  lib/                 类型、i18n（中英）、服务端与浏览器端 API 客户端
  public/              自制 SVG 占位图
```

## 本地运行

前置：Go 1.23+、Node 20+、Docker Desktop。

```powershell
# 1) 数据层
docker compose up -d

# 2) 后端（自动执行 migrations，监听 :8080）
cd backend
go run ./cmd/server
# 或者：go build -o bin\aifa-api.exe ./cmd/server ; .\bin\aifa-api.exe

# 3) 前端（:3000，/api/* 反代到 :8080）
cd frontend
npm install
npm run dev            # 开发
# npm run build; npm run start   # 生产
```

也可以直接运行根目录的 `.\start.ps1`（依次拉起 Docker、后端、前端）。

## 路由

| 路径 | 说明 |
| --- | --- |
| `/`（`?lang=zh\|en`、`?screen=library`） | 首页：日更封面滑块 + 栏目第二屏 |
| `/u/{authorNo}` | 作者页（专栏、文章列表、订阅） |
| `/u/{authorNo}/{slug}` | 深色阅读器：翻页、目录、收藏、分享、留言 |
| `/columns` | 专栏名册 |
| `/research` | 研究报告：精选报告 + 资料目录 + 留资下载 + 订阅 |
| `/academy` | 学院：货架 + 课程海报卡 + 按人群浏览 |
| `/go-global` | 出海：图集、路线图、行程亮点、服务台 |
| `/about` | 关于：视频、相关阅读、意见反馈 |
| `/library` | 书架：收藏 / 资源 / 已订阅作者 |
| `/account/login` | 邮箱验证码登录（开发模式直接回显 6 位码） |

## API（`/api`）

- 内容：`GET /home` `/daily?date=` `/articles/{slug}` `/articles?q=` `/columns` `/authors/{no}` `/research` `/academy` `/go-global` `/about`
- 账户：`POST /auth/otp` `/auth/verify` `/auth/logout`、`GET /auth/me`、`PATCH /auth/profile`
- 个人：`GET|POST /shelf`、`DELETE /shelf/{kind}/{target}`、`POST /progress`、`POST|DELETE /authors/{no}/subscribe`
- 互动：`GET|POST /articles/{slug}/comments`、`DELETE /comments/{id}`
- 表单：`POST /consult`、`GET /consult/{id}`、`POST /consult/{id}`、`/newsletter`、`/research/{slug}/lead`、`/feedback`、`/track`

## 配置（环境变量，默认值即可本地跑）

`PORT=8080`、`DATABASE_URL=postgres://aifa:aifa_secret@localhost:5432/aifa?sslmode=disable`、
`REDIS_ADDR=localhost:6379`、`DEV_MODE=true`（OTP 回显）、`ALLOWED_ORIGINS=http://localhost:3000`、
前端侧 `API_ORIGIN=http://localhost:8080`。

## 校验命令

```powershell
cd backend ; go vet ./...
cd frontend ; npx tsc --noEmit ; npm run build
```
