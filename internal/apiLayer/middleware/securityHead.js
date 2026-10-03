/**
 * 安全头中间件
 * 为响应添加 HTTP 安全头，防止常见 Web 攻击
 */

function securityHead(req, res, next) {
  // 禁用 X-Powered-By
  res.setHeader('X-Powered-By', '');
  // 防止 MIME 类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');
  // 启用浏览器 XSS 过滤
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // 引用策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP：对内页和 API 施加严格策略；前端脚本已内联，故 script-src 需允许 'unsafe-inline'
  // widget.js 是动态嵌入到外部网站的，不做 CSP 限制
  const pathname = req.path;
  if (pathname === '/' || pathname === '/index.html' || pathname === '/admin.html' || pathname === '/preview.html' || pathname.startsWith('/api/')) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
    );
  }

  next();
}

module.exports = securityHead;
