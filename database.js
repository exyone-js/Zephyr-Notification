const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'data.json');

function read() {
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    // 迁移旧格式（数组）为新格式（按用户分组）
    if (Array.isArray(raw)) {
      const migrated = { _migrated: raw };
      write(migrated);
      return migrated;
    }
    return raw || {};
  }
  catch { return {}; }
}

function write(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function uuid() {
  return crypto.randomUUID();
}

function now() {
  const d = new Date();
  d.setHours(d.getHours() + 8);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

module.exports = {
  getAll(userId) {
    const all = read();
    const list = all[userId] || [];
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getActive(userId) {
    const all = read();
    const list = all[userId] || [];
    return list.filter(n => n.is_active).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getEmergency(userId) {
    const all = read();
    const list = all[userId] || [];
    return list.filter(n => n.is_emergency && n.is_active).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getById(userId, id) {
    const all = read();
    const list = all[userId] || [];
    return list.find(n => n.id === id) || null;
  },

  create(userId, { title, content, type, is_emergency }) {
    const all = read();
    if (!all[userId]) all[userId] = [];
    const item = {
      id: uuid(),
      title,
      content: content || '',
      type: type || 'info',
      is_emergency: !!is_emergency,
      is_active: true,
      created_at: now(),
      updated_at: now()
    };
    all[userId].push(item);
    write(all);
    return item;
  },

  update(userId, id, fields) {
    const all = read();
    const list = all[userId] || [];
    if (!all[userId]) all[userId] = [];
    const idx = list.findIndex(n => n.id === id);
    if (idx === -1) return null;
    const existing = list[idx];
    list[idx] = {
      ...existing,
      title: fields.title !== undefined ? fields.title : existing.title,
      content: fields.content !== undefined ? fields.content : existing.content,
      type: fields.type !== undefined ? fields.type : existing.type,
      is_emergency: fields.is_emergency !== undefined ? !!fields.is_emergency : existing.is_emergency,
      is_active: fields.is_active !== undefined ? !!fields.is_active : existing.is_active,
      updated_at: now()
    };
    write(all);
    return list[idx];
  },

  delete(userId, id) {
    const all = read();
    const list = all[userId] || [];
    const idx = list.findIndex(n => n.id === id);
    if (idx === -1) return { changes: 0 };
    list.splice(idx, 1);
    write(all);
    return { changes: 1 };
  },

  deleteAll(userId) {
    const all = read();
    all[userId] = [];
    write(all);
    return { changes: 1 };
  },

  // 公共接口：合并所有用户的通知
  getAllPublic() {
    const all = read();
    const list = [];
    Object.values(all).forEach(arr => {
      if (Array.isArray(arr)) arr.forEach(n => list.push(n));
    });
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getActivePublic() {
    return this.getAllPublic().filter(n => n.is_active);
  },

  getEmergencyPublic() {
    return this.getAllPublic().filter(n => n.is_emergency && n.is_active);
  }
};
