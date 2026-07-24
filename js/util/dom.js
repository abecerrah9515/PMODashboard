export function $(id) { return document.getElementById(id); }

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function empty(t, s) {
  return '<div class="empty"><b>' + esc(t) + '</b>' + esc(s) + '</div>';
}
