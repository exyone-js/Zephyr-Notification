/**
 * 版本升级脚本
 * 自增 VERSION 文件版本号。
 * 前端页脚版本号通过 /api/version 在运行时读取，无需再改 HTML。
 * 注意：VERSION 现为 semver 字符串（如 2.0），脚本按补丁位自增（2.0 → 2.0.1 不适用，
 *       这里保持原有“次版本 +0.1”语义，仅当版本为单个小数点数值时生效）。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const verFile = path.join(root, 'VERSION');
const current = fs.readFileSync(verFile, 'utf8').trim();

let next;
if (/^\d+\.\d+$/.test(current)) {
  next = (parseFloat(current) + 0.1).toFixed(1);
} else {
  console.error('当前 VERSION（' + current + '）不是 x.y 数值格式，请手动编辑 VERSION 文件。');
  process.exit(1);
}

fs.writeFileSync(verFile, next + '\n', 'utf8');
console.log('Version bumped: ' + current + ' → ' + next);
console.log('提示：前端版本号经 /api/version 动态读取；如部署 Worker，请重新运行 build 脚本。');
