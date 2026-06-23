import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('/*', cors());

// ---- file contents ----
const WIDGET_JS = `__WIDGET_JS__`;
const ADMIN_HTML = `__ADMIN_HTML__`;
const ADMIN_CSS = `__ADMIN_CSS__`;
const ADMIN_JS = `__ADMIN_JS__`;
const PREVIEW_HTML = `__PREVIEW_HTML__`;

// ---- static file routes ----
app.get('/widget.js', c => c.newResponse(WIDGET_JS, 200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' }));
app.get('/admin.html', c => c.html(ADMIN_HTML));
app.get('/admin.css', c => c.newResponse(ADMIN_CSS, 200, { 'Content-Type': 'text/css; charset=utf-8' }));
app.get('/admin.js', c => c.newResponse(ADMIN_JS, 200, { 'Content-Type': 'application/javascript; charset=utf-8' }));
app.get('/preview.html', c => c.html(PREVIEW_HTML));
app.get('/', c => c.redirect('/admin.html'));

// ---- GitHub OAuth (Worker 版) ----
const SESSION_TTL = 7 * 24 * 3600; // 7天

app.get('/auth/github', c => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  if (!clientId) return c.text('GitHub OAuth 未配置', 500);
  const url = new URL(c.req.url);
  const callback = `${url.protocol}//${url.host}/auth/github/callback`;
  return c.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user&redirect_uri=${encodeURIComponent(callback)}`);
});

app.get('/auth/github/callback', async c => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  const clientSecret = c.env.GITHUB_CLIENT_SECRET;
  const code = c.req.query('code');
  if (!code) return c.redirect('/admin.html?error=no_code');
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Notification-System' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return c.redirect('/admin.html?error=token_failed');

    const userRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'User-Agent': 'Notification-System', 'Accept': 'application/json' }
    });
    const user = await userRes.json();
    if (!user.id) return c.redirect('/admin.html?error=user_failed');

    // 生成 session token，存储到 KV
    const sessionId = crypto.randomUUID();
    const session = { id: String(user.id), login: user.login, name: user.name, avatar: user.avatar_url };
    await c.env.NOTIFICATIONS.put(`session:${sessionId}`, JSON.stringify(session), { expirationTtl: SESSION_TTL });

    const url = new URL(c.req.url);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin.html',
        'Set-Cookie': `ns_token=${sessionId}; Path=/; Max-Age=${SESSION_TTL}; HttpOnly; SameSite=Lax`
      }
    });
  } catch (e) {
    return c.redirect('/admin.html?error=auth_failed');
  }
});

app.get('/api/auth/me', async c => {
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.match(/ns_token=([^;]+)/);
  if (!match) return c.json({ success: true, data: null });
  const raw = await c.env.NOTIFICATIONS.get(`session:${match[1]}`, 'json');
  if (!raw) return c.json({ success: true, data: null });
  return c.json({ success: true, data: raw });
});

app.get('/auth/logout', async c => {
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.match(/ns_token=([^;]+)/);
  if (match) await c.env.NOTIFICATIONS.delete(`session:${match[1]}`);
  return new Response(null, {
    status: 302,
    headers: { 'Location': '/admin.html', 'Set-Cookie': 'ns_token=; Path=/; Max-Age=0' }
  });
});

// ---- KV 存储 ----
function store(env, userId) {
  const KV = env.NOTIFICATIONS;
  const key = userId ? `ns:${userId}` : 'ns:public';
  return {
    async getAll() {
      let raw = await KV.get(key, 'json') || [];
      // 兼容旧 single-key 数据
      const old = await KV.get('notifications', 'json');
      if (Array.isArray(old)) {
        raw = raw.concat(old);
        await KV.put(key, JSON.stringify(raw));
        await KV.delete('notifications');
      }
      return raw.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    async saveAll(list) { await KV.put(key, JSON.stringify(list)); },
    async getActive() { return (await this.getAll()).filter(n => n.is_active); },
    async getEmergency() { return (await this.getAll()).filter(n => n.is_emergency && n.is_active); },
    async getById(id) { return (await this.getAll()).find(n => n.id === id) || null; },
    async create({ title, content, type, is_emergency }) {
      const all = await this.getAll();
      const item = {
        id: crypto.randomUUID(), title, content: content || '', type: type || 'info',
        is_emergency: !!is_emergency, is_active: true,
        created_at: now(), updated_at: now()
      };
      all.push(item);
      await this.saveAll(all);
      return item;
    },
    async update(id, fields) {
      const all = await this.getAll();
      const idx = all.findIndex(n => n.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...fields, updated_at: now() };
      await this.saveAll(all);
      return all[idx];
    },
    async delete(id) {
      const all = await this.getAll();
      const idx = all.findIndex(n => n.id === id);
      if (idx === -1) return { changes: 0 };
      all.splice(idx, 1);
      await this.saveAll(all);
      return { changes: 1 };
    },
    async deleteAll() { await KV.put(key, '[]'); }
  };
}

// 读取所有用户通知（公共接口）
async function getAllPublic(env) {
  const all = [];
  try {
    const list = await env.NOTIFICATIONS.list({ prefix: 'ns:' });
    for (const key of list.keys) {
      const raw = await env.NOTIFICATIONS.get(key.name, 'json');
      if (Array.isArray(raw)) raw.forEach(n => { if (n.is_active) all.push(n); });
    }
  } catch (e) {}
  // 兼容旧 notifications 键
  try {
    const old = await env.NOTIFICATIONS.get('notifications', 'json');
    if (Array.isArray(old)) old.forEach(n => { if (n.is_active) all.push(n); });
  } catch (e) {}
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function now() { const d = new Date(); d.setHours(d.getHours() + 8); return d.toISOString().replace('T', ' ').slice(0, 19); }

// ---- 认证中间件 ----
async function authMiddleware(c, next) {
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.match(/ns_token=([^;]+)/);
  if (!match) return c.json({ success: false, message: '请先登录' }, 401);
  const raw = await c.env.NOTIFICATIONS.get(`session:${match[1]}`, 'json');
  if (!raw) return c.json({ success: false, message: '登录已过期' }, 401);
  c.set('user', raw);
  return next();
}

// ---- API routes ----

// 后台管理接口（需要登录）
app.get('/api/notifications', authMiddleware, async c => {
  const db = store(c.env, c.get('user').id);
  return c.json({ success: true, data: await db.getAll() });
});

// 公共接口（小铃铛用）
app.get('/api/notifications/active', async c => {
  const userId = c.req.query('u');
  if (userId) {
    const db = store(c.env, userId);
    const data = await db.getActive();
    if (data.length) return c.json({ success: true, data });
    // 用户无数据时回退到公共
  }
  return c.json({ success: true, data: await getAllPublic(c.env) });
});

app.get('/api/notifications/emergency', async c => {
  const all = await getAllPublic(c.env);
  return c.json({ success: true, data: all.filter(n => n.is_emergency) });
});

// SSE 实时推送
app.get('/api/notifications/stream', async c => {
  let lastHash = '';
  const body = new ReadableStream({
    async start(controller) {
      controller.enqueue('data: connected\n\n');
      for (let i = 0; i < 300; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const all = await getAllPublic(c.env);
          const hash = all.length.toString();
          if (hash !== lastHash) {
            lastHash = hash;
            controller.enqueue('event: update\ndata: {}\n\n');
          }
        } catch (e) { break; }
      }
      controller.close();
    }
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' }
  });
});

app.get('/api/notifications/:id', authMiddleware, async c => {
  const db = store(c.env, c.get('user').id);
  const item = await db.getById(c.req.param('id'));
  if (!item) return c.json({ success: false, message: '通知不存在' }, 404);
  return c.json({ success: true, data: item });
});
app.post('/api/notifications', authMiddleware, async c => {
  const db = store(c.env, c.get('user').id);
  const body = await c.req.json();
  if (!body.title) return c.json({ success: false, message: '标题不能为空' }, 400);
  const item = await db.create(body);
  return c.json({ success: true, data: item }, 201);
});
app.put('/api/notifications/:id', authMiddleware, async c => {
  const db = store(c.env, c.get('user').id);
  const item = await db.update(c.req.param('id'), await c.req.json());
  if (!item) return c.json({ success: false, message: '通知不存在' }, 404);
  return c.json({ success: true, data: item });
});
app.delete('/api/notifications/:id', authMiddleware, async c => {
  const db = store(c.env, c.get('user').id);
  const r = await db.delete(c.req.param('id'));
  if (!r.changes) return c.json({ success: false, message: '通知不存在' }, 404);
  return c.json({ success: true, message: '删除成功' });
});
app.post('/api/notifications/clear-all', authMiddleware, async c => {
  const db = store(c.env, c.get('user').id);
  await db.deleteAll();
  return c.json({ success: true, message: '已清空所有通知' });
});
app.get('/api/widget-code', c => {
  const u = new URL(c.req.url);
  const userId = u.searchParams.get('u') || '';
  return c.json({ success: true, data: `<script src="${u.protocol}//${u.host}/widget.js${userId ? '?u=' + userId : ''}"></script>` });
});

export default app;
