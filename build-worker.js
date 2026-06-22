const fs = require('fs');
const path = require('path');

const base = fs.readFileSync(path.join(__dirname, 'worker-base.js'), 'utf8');
const widgetJs = fs.readFileSync(path.join(__dirname, 'public', 'widget.js'), 'utf8');
const adminHtml = fs.readFileSync(path.join(__dirname, 'public', 'admin.html'), 'utf8');
const adminCss = fs.readFileSync(path.join(__dirname, 'public', 'admin.css'), 'utf8');
const adminJs = fs.readFileSync(path.join(__dirname, 'public', 'admin.js'), 'utf8');
const previewHtml = fs.readFileSync(path.join(__dirname, 'public', 'preview.html'), 'utf8');

function escapeTemplate(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

let result = base;
result = result.replace('__WIDGET_JS__', escapeTemplate(widgetJs));
result = result.replace('__ADMIN_HTML__', escapeTemplate(adminHtml));
result = result.replace('__ADMIN_CSS__', escapeTemplate(adminCss));
result = result.replace('__ADMIN_JS__', escapeTemplate(adminJs));
result = result.replace('__PREVIEW_HTML__', escapeTemplate(previewHtml));

fs.writeFileSync(path.join(__dirname, 'worker.js'), result, 'utf8');
console.log('worker.js generated:', result.length, 'bytes');
