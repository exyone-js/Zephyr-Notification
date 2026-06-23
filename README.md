# Notification System 鈥?閮ㄧ讲鏂囨。

## 椤圭洰缁撴瀯

```
notification-system/
鈹溾攢鈹€ server.js          # Node.js 鏈湴鍚庣
鈹溾攢鈹€ database.js        # JSON 鏂囦欢鏁版嵁搴?鈹溾攢鈹€ worker-base.js     # Cloudflare Worker 妯℃澘
鈹溾攢鈹€ worker.js          # Worker 鍏ュ彛锛堟瀯寤虹敓鎴愶級
鈹溾攢鈹€ build-worker.js    # 鍐呰仈鎵撳寘鑴氭湰
鈹溾攢鈹€ wrangler.toml      # Worker 閰嶇疆
鈹溾攢鈹€ package.json
鈹溾攢鈹€ .env.example       # 鐜鍙橀噺妯℃澘
鈹斺攢鈹€ public/
    鈹溾攢鈹€ admin.html     # 鍚庡彴绠＄悊
    鈹溾攢鈹€ admin.css
    鈹溾攢鈹€ admin.js
    鈹溾攢鈹€ widget.js      # 鍓嶇鎮诞灏忛搩閾?    鈹溾攢鈹€ widget.css
    鈹斺攢鈹€ preview.html   # 棰勮椤甸潰
```

## 鍔熻兘鐗规€?
- GitHub OAuth 鐧诲綍
- 澶氱敤鎴烽殧绂伙紙涓嶅悓 GitHub 璐﹀彿鐙珛绠＄悊閫氱煡锛?- 鎮诞灏忛搩閾涚粍浠讹紙Material Design锛?- 宸茶/鏈鏍囩椤?+ 鍒嗛〉
- 閫氱煡鎻愮ず闊筹紙Web Audio锛?- SSE 瀹炴椂鎺ㄩ€?- HTML 鍐呭鏀寔
- 鎼滅储閫氱煡
- 绉诲姩绔€傞厤

---

## 涓€銆佹湰鍦板紑鍙?
```bash
# 瀹夎渚濊禆
npm install

# 澶嶅埗鐜鍙橀噺閰嶇疆
cp .env.example .env

# 缂栬緫 .env锛屽～鍏?GitHub OAuth 鍑嵁
# GITHUB_CLIENT_ID=浣犵殑ClientID
# GITHUB_CLIENT_SECRET=浣犵殑ClientSecret
# JWT_SECRET=闅忔満瀛楃涓?
# 鍚姩
npm start
```

璁块棶 http://localhost:3456/admin.html

> GitHub OAuth App 鍥炶皟 URL锛歚http://localhost:3456/auth/github/callback`

---

## 浜屻€侀儴缃插埌 Cloudflare Workers

### 1. 鐧诲綍

```bash
npx wrangler login
```

### 2. 鍒涘缓 KV 鍛藉悕绌洪棿

```bash
npx wrangler kv namespace create NOTIFICATIONS
npx wrangler kv namespace create NOTIFICATIONS --preview
```

灏嗚緭鍑虹殑 `id` 鍜?`preview_id` 濉叆 `wrangler.toml`銆?
### 3. 閰嶇疆 wrangler.toml

```toml
name = "notification-system"
main = "worker.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "NOTIFICATIONS"
id = "浣犵殑KV_ID"
preview_id = "浣犵殑Preview_ID"

[vars]
GITHUB_CLIENT_ID = "浣犵殑GitHub OAuth Client ID"

[observability]
enabled = true
```

### 4. 璁剧疆瀵嗛挜

```bash
echo "浣犵殑GitHub OAuth Client Secret" | npx wrangler secret put GITHUB_CLIENT_SECRET
```

### 5. 鏋勫缓骞堕儴缃?
```bash
node build-worker.js && npx wrangler deploy
```

### 6. GitHub OAuth App 閰嶇疆

鍥炶皟 URL 璁句负锛?```
https://浣犵殑鍩熷悕.workers.dev/auth/github/callback
```

---

## 涓夈€佸祵鍏ョ綉绔?
鍦ㄧ綉椤典换鎰忎綅缃坊鍔狅細

```html
<script src="https://浣犵殑鍩熷悕.workers.dev/widget.js"></script>
```

---

## 鍥涖€佹洿鏂伴儴缃?
```bash
node build-worker.js && npx wrangler deploy
```

---

## 浜斻€佸父鐢ㄥ懡浠?
| 鍛戒护 | 璇存槑 |
|------|------|
| `npm start` | 鏈湴鍚姩 |
| `npx wrangler dev` | Worker 鏈湴璋冭瘯 |
| `npx wrangler deploy` | 閮ㄧ讲 |
| `npx wrangler tail` | 瀹炴椂鏃ュ織 |
| `npx wrangler rollback` | 鍥炴粴 |
| `npx wrangler kv namespace list` | 鍒楀嚭 KV |

---

Powered By [002.HK](https://github.com/govmoe/Notification-System)
