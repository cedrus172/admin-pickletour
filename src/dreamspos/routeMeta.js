// Sổ tra tên trang theo đường dẫn (App đăng ký routes lúc khởi động) — tránh vòng import
// routes.js ↔ các trang khi phần đầu trang cần tiêu đề.
import { matchPath } from "react-router-dom";

let registry = [];

const flatten = (routes, out = []) => {
  (routes || []).forEach((r) => {
    if (r.collapse) flatten(r.collapse, out);
    if (r.route) out.push({ route: r.route, name: r.name || "", key: r.key });
  });
  return out;
};

export function registerRoutes(routes) {
  registry = flatten(routes)
    // đường dẫn cụ thể hơn (dài hơn, ít tham số hơn) xét trước
    .sort((a, b) => b.route.length - a.route.length);
}

export function findRouteMeta(pathname) {
  return registry.find((r) => matchPath({ path: r.route, end: true }, pathname)) || null;
}
