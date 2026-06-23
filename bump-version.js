const fs = require('fs');
const path = require('path');

// 读取当前版本
const verFile = path.join(__dirname, 'VERSION');
const current = parseFloat(fs.readFileSync(verFile, 'utf8').trim());
const next = (current + 0.1).toFixed(1);

// 更新 VERSION 文件
fs.writeFileSync(verFile, next + '\n', 'utf8');

// 更新 admin.html
let admin = fs.readFileSync(path.join(__dirname, 'public', 'admin.html'), 'utf8');
admin = admin.replace(/v\d+\.\d+/, 'v' + next);
fs.writeFileSync(path.join(__dirname, 'public', 'admin.html'), admin, 'utf8');

// 更新 preview.html
let preview = fs.readFileSync(path.join(__dirname, 'public', 'preview.html'), 'utf8');
preview = preview.replace(/v\d+\.\d+/, 'v' + next);
fs.writeFileSync(path.join(__dirname, 'public', 'preview.html'), preview, 'utf8');

console.log('Version bumped: ' + current + ' → ' + next);
