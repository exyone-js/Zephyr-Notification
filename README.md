# Cloudflare Workers 部署文档

## 项目说明

信息通知系统，包含后台管理、前端悬浮小铃铛组件、实时推送。

## 一键部署

```bash
# 1. 安装依赖
npm install

# 2. 登录 Cloudflare
npx wrangler login

# 3. 创建 KV 命名空间
npx wrangler kv namespace create NOTIFICATIONS
npx wrangler kv namespace create NOTIFICATIONS --preview

# 4. 将输出的 id 和 preview_id 填入 wrangler.toml
#   id = "xxx"
#   preview_id = "xxx"

# 5. 构建并部署
node build-worker.js && npx wrangler deploy
```

部署成功后访问 `https://notification-system.xxx.workers.dev/admin.html`

## wrangler.toml 配置

```toml
name = "notification-system"
main = "worker.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "NOTIFICATIONS"
id = "你的生产环境KV_ID"
preview_id = "你的预览环境KV_ID"

[observability]
enabled = true
```

## 嵌入网站

在网页任意位置添加一行代码：

```html
<script src="https://你的域名.workers.dev/widget.js"></script>
```

页面右上角会出现悬浮通知铃铛，支持已读/未读标签页切换、分页、关闭提示音。

## 本地开发

```bash
npm start
# 访问 http://localhost:3456/admin.html
```

## 更新部署

```bash
node build-worker.js && npx wrangler deploy
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npx wrangler deploy` | 部署 |
| `npx wrangler tail` | 查看实时日志 |
| `npx wrangler kv namespace list` | 列出 KV 命名空间 |
| `npx wrangler rollback` | 回滚版本 |
| `npx wrangler whoami` | 查看登录状态 |

## 故障排查

**部署失败网络不通**
```bash
# 检查 DNS
nslookup api.cloudflare.com
```

**widget.js 未更新**
```bash
# 清除 CDN 缓存后重新部署
node build-worker.js && npx wrangler deploy
```

**KV 数据异常**
```bash
# 清空通知数据
npx wrangler kv key delete --binding=NOTIFICATIONS notifications
```

## 免费额度

- 10 万请求/天
- 1 GB KV 存储
- 对于通知系统足够使用

© 002.HK
