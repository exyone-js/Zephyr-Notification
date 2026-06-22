const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== API 路由 ==========

app.get('/api/notifications', (req, res) => {
  res.json({ success: true, data: db.getAll() });
});

app.get('/api/notifications/active', (req, res) => {
  res.json({ success: true, data: db.getActive() });
});

app.get('/api/notifications/emergency', (req, res) => {
  res.json({ success: true, data: db.getEmergency() });
});

// SSE 实时推送 - must be before :id route
const sseClients = new Set();

app.get('/api/notifications/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.write('data: connected\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

function notifySSE() {
  sseClients.forEach(client => {
    client.write('event: update\ndata: {}\n\n');
  });
}

const _create = db.create; const _update = db.update;
const _delete = db.delete; const _deleteAll = db.deleteAll;
db.create = (...args) => { const r = _create(...args); notifySSE(); return r; };
db.update = (...args) => { const r = _update(...args); notifySSE(); return r; };
db.delete = (...args) => { const r = _delete(...args); notifySSE(); return r; };
db.deleteAll = (...args) => { const r = _deleteAll(...args); notifySSE(); return r; };

app.get('/api/notifications/:id', (req, res) => {
  const item = db.getById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: '通知不存在' });
  res.json({ success: true, data: item });
});

app.post('/api/notifications', (req, res) => {
  const { title, content, type, is_emergency } = req.body;
  if (!title) return res.status(400).json({ success: false, message: '标题不能为空' });
  const item = db.create({ title, content, type, is_emergency });
  res.status(201).json({ success: true, data: item });
});

app.put('/api/notifications/:id', (req, res) => {
  const item = db.update(req.params.id, req.body);
  if (!item) return res.status(404).json({ success: false, message: '通知不存在' });
  res.json({ success: true, data: item });
});

app.delete('/api/notifications/:id', (req, res) => {
  const result = db.delete(req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: '通知不存在' });
  res.json({ success: true, message: '删除成功' });
});

app.post('/api/notifications/clear-all', (req, res) => {
  db.deleteAll();
  res.json({ success: true, message: '已清空所有通知' });
});

// 获取嵌入代码
app.get('/api/widget-code', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;
  const code = `<script src="${baseUrl}/widget.js"></script>`;
  res.json({ success: true, data: code });
});

app.listen(PORT, () => {
  console.log(`通知系统已启动: http://localhost:${PORT}`);
  console.log(`后台管理: http://localhost:${PORT}/admin.html`);
  console.log(`预览页面: http://localhost:${PORT}/preview.html`);
});
