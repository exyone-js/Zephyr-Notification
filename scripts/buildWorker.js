/**
 * Cloudflare Worker 构建脚本
 * 内联 cmd/workerCf/main.js + public/ 中的静态文件到单文件 worker.js
 *
 * 使用方法：node scripts/buildWorker.js
 * 输出：worker.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const base = fs.readFileSync(path.join(root, 'cmd', 'workerCf', 'main.js'), 'utf8');
const widgetJs = fs.readFileSync(path.join(root, 'public', 'widget.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'public', 'admin.html'), 'utf8');
const previewHtml = fs.readFileSync(path.join(root, 'public', 'preview.html'), 'utf8');
const i18nConfig = JSON.parse(fs.readFileSync(path.join(root, 'locales', 'config.json'), 'utf8'));
const i18nLocales = {};
i18nConfig.locales.forEach(l => {
  i18nLocales[l.code] = fs.readFileSync(path.join(root, 'locales', l.file), 'utf8');
});

function escapeTemplate(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

let result = base;
result = result.replace('__WIDGET_JS__', escapeTemplate(widgetJs));
result = result.replace('__INDEX_HTML__', escapeTemplate(indexHtml));
result = result.replace('__ADMIN_HTML__', escapeTemplate(adminHtml));
result = result.replace('__PREVIEW_HTML__', escapeTemplate(previewHtml));
result = result.replace('__I18N_CONFIG__', escapeTemplate(JSON.stringify(i18nConfig)));
result = result.replace('__I18N_LOCALES__', escapeTemplate(JSON.stringify(i18nLocales)));
result = result.replace('__APP_VERSION__', escapeTemplate(fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim()));

fs.writeFileSync(path.join(root, 'worker.js'), result, 'utf8');
console.log('worker.js generated:', result.length, 'bytes');
