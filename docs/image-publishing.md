# 镜像发布（GitHub Actions / GHCR）

仓库已提供 GitHub Actions：`.github/workflows/docker-images.yml`，用于在打 tag 时构建并推送镜像到 GHCR（`ghcr.io`）。

## 触发方式

- 推送 tag：`v*`（例如 `v0.1.0`）
- 或手动触发：GitHub -> Actions -> `docker-images` -> Run workflow

## 产物镜像

默认会推送 4 个镜像（可按需修改 workflow 中的命名）：

- `ghcr.io/<owner>/poco-backend`
- `ghcr.io/<owner>/poco-executor-manager`
- `ghcr.io/<owner>/poco-executor`
- `ghcr.io/<owner>/poco-frontend`

tag 策略：

- `latest`（仅默认分支）
- `sha-<commit>`（每次构建）
- `vX.Y.Z`（当触发来源是 tag）

## 前端后端地址（运行时变量，推荐）

Frontend 默认通过 Next.js 的同源 API 代理（`/api/v1/* -> Backend`）访问后端，因此后端地址可以在 **运行时（runtime）** 配置：

- `BACKEND_URL`：Next.js 服务器侧用于转发 `/api/v1/*` 的 Backend base URL（例如 `http://backend:8000`；兼容旧变量：`POCO_BACKEND_URL`）

这样发布到 GHCR 的前端镜像可以做到“一个镜像适配不同部署环境”，无需为了不同后端地址重复构建。

> 仍可选用 `NEXT_PUBLIC_API_URL`（构建期变量）让浏览器直连后端，但这会被 Next.js 内联到产物，不利于复用镜像。

## 用发布镜像启动

你可以在 `docker-compose.yml` 中覆盖各服务的 `*_IMAGE` 环境变量：

- `BACKEND_IMAGE`
- `EXECUTOR_MANAGER_IMAGE`
- `EXECUTOR_IMAGE`
- `FRONTEND_IMAGE`

例如：

```bash
export BACKEND_IMAGE=ghcr.io/<owner>/poco-backend:v0.1.0
export EXECUTOR_MANAGER_IMAGE=ghcr.io/<owner>/poco-executor-manager:v0.1.0
export EXECUTOR_IMAGE=ghcr.io/<owner>/poco-executor:v0.1.0
export FRONTEND_IMAGE=ghcr.io/<owner>/poco-frontend:v0.1.0

docker compose up -d
```
