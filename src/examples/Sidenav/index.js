// src/examples/Sidenav/index.jsx
/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

import { useMaterialUIController, setMiniSidenav } from "context";

import { useDispatch, useSelector } from "react-redux";
import { logout as clearAuth } from "slices/authSlice";
import { useLogoutMutation } from "slices/authApiSlice";
import { apiSlice } from "slices/apiSlice";
import { getUserRoles, isStrictSuperAdminUser, normalizeRole } from "utils/authz";
import Feather from "dreamspos/Feather";

function clearAllCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
}

const canView = (route, user) => {
  // non-private route -> visible unless show=false
  if (!route.private) return route.show !== false;
  // private route -> must be logged in
  if (!user) return false;
  if (route.requireAdminAndSuperAdmin || route.requireAdminAndSuperUser) {
    return isStrictSuperAdminUser(user);
  }
  // if roles are defined -> user needs at least one matching role
  if (route.roles && route.roles.length > 0) {
    const roles = getUserRoles(user);
    const allowed = route.roles.map(normalizeRole).filter(Boolean);
    return roles.some((r) => allowed.includes(r));
  }
  return true;
};

/* ───────────────── gom nhóm menu theo phân loại ───────────────── */
const GROUP_ORDER = [
  "Tổng quan",
  "Sân & Đặt sân",
  "Giải đấu & Trận đấu",
  "Trọng tài & Overlay",
  "Người dùng & Điểm trình",
  "Nội dung & Truyền thông",
  "Email & Tài chính",
  "Livestream · FB · YouTube",
  "Hệ thống & Cấu hình",
  "Giám sát & Nhật ký",
  "Bảo mật & Hạ tầng",
];

// key của route -> nhóm hiển thị. Route không có trong map rơi vào "Khác".
const KEY_GROUP = {
  dashboard: "Tổng quan",

  "venue-management": "Sân & Đặt sân",
  "venue-detail": "Sân & Đặt sân",
  "booking-management": "Sân & Đặt sân",
  "admin-court-free-manager": "Sân & Đặt sân",
  "court-owner-requests": "Sân & Đặt sân",
  reconciliation: "Sân & Đặt sân",

  tournaments: "Giải đấu & Trận đấu",
  "tournament-new": "Giải đấu & Trận đấu",
  "tournament-edit": "Giải đấu & Trận đấu",
  "tournament-registrations": "Giải đấu & Trận đấu",
  "tournament-brackets": "Giải đấu & Trận đấu",
  "admin-matches": "Giải đấu & Trận đấu",
  "match-viewer": "Giải đấu & Trận đấu",
  "admin-match-detail": "Giải đấu & Trận đấu",
  "admin-live-sessions": "Giải đấu & Trận đấu",
  "admin-court-clusters": "Giải đấu & Trận đấu",
  "tournament-matches": "Giải đấu & Trận đấu",
  "tournament-bracket-view": "Giải đấu & Trận đấu",
  "tournament-bracket-story": "Giải đấu & Trận đấu",
  "bracket-preassign": "Giải đấu & Trận đấu",
  "tournament-blueprint": "Giải đấu & Trận đấu",
  "auto-registrations": "Giải đấu & Trận đấu",
  "admin-bracket-courts": "Giải đấu & Trận đấu",
  "rating-tester": "Giải đấu & Trận đấu",
  "bracket-group-insert": "Giải đấu & Trận đấu",
  "ai-registration-import": "Giải đấu & Trận đấu",

  "overlay-index": "Trọng tài & Overlay",
  "admin-referee-console-match": "Trọng tài & Overlay",
  "admin-referee-console": "Trọng tài & Overlay",
  "admin-referee-matches": "Trọng tài & Overlay",
  "referee-matches": "Trọng tài & Overlay",

  "user-management": "Người dùng & Điểm trình",
  "nickname-requests": "Người dùng & Điểm trình",
  "coach-approvals": "Người dùng & Điểm trình",
  "self-assessment-management": "Người dùng & Điểm trình",
  "assessment-history": "Người dùng & Điểm trình",
  "evaluator-management": "Người dùng & Điểm trình",
  "review-moderation": "Người dùng & Điểm trình",
  "auto-users": "Người dùng & Điểm trình",
  "sign-in": "Người dùng & Điểm trình",
  "sign-up": "Người dùng & Điểm trình",

  "admin-news": "Nội dung & Truyền thông",
  "admin-blog": "Nội dung & Truyền thông",
  "admin-feed": "Nội dung & Truyền thông",
  "admin-chat": "Nội dung & Truyền thông",
  "news-list": "Nội dung & Truyền thông",
  "news-detail": "Nội dung & Truyền thông",
  "cms-hero": "Nội dung & Truyền thông",
  "cms-contact": "Nội dung & Truyền thông",
  "admin-sponsors": "Nội dung & Truyền thông",
  "admin-broadcast": "Nội dung & Truyền thông",
  "support-manager": "Nội dung & Truyền thông",
  "news-image-monitor": "Nội dung & Truyền thông",

  "admin-email-campaigns": "Email & Tài chính",
  "admin-email-contacts": "Email & Tài chính",
  "admin-finance": "Email & Tài chính",

  "fb-live-config": "Livestream · FB · YouTube",
  "fb-page-monitor": "Livestream · FB · YouTube",
  "fb-page-tokens": "Livestream · FB · YouTube",
  "event-live-monitor": "Livestream · FB · YouTube",
  "admin-youtube-live": "Livestream · FB · YouTube",
  "admin-live-playback": "Livestream · FB · YouTube",
  "push-realtime": "Livestream · FB · YouTube",
  "live-recording-monitor": "Livestream · FB · YouTube",
  "live-recording-drive-monitor": "Livestream · FB · YouTube",
  "live-recording-ai-commentary-monitor": "Livestream · FB · YouTube",
  "drive-video-manager": "Livestream · FB · YouTube",
  "fb-vod-drive-monitor": "Livestream · FB · YouTube",

  "system-settings": "Hệ thống & Cấu hình",
  "system-config": "Hệ thống & Cấu hình",
  "ai-gateway-settings": "Hệ thống & Cấu hình",
  "zalo-zns-logs": "Hệ thống & Cấu hình",
  "algo-settings": "Hệ thống & Cấu hình",
  "admin-app-version": "Hệ thống & Cấu hình",
  "admin-files": "Hệ thống & Cấu hình",
  "admin-cache-manager": "Hệ thống & Cấu hình",
  "admin-avatar-optimization": "Hệ thống & Cấu hình",
  "admin-ota": "Hệ thống & Cấu hình",

  "admin-primary-logs": "Giám sát & Nhật ký",
  "admin-system-monitor": "Giám sát & Nhật ký",
  "admin-monitor": "Giám sát & Nhật ký",
  "admin-audit-logs": "Giám sát & Nhật ký",
  "auth-log-management": "Giám sát & Nhật ký",
  "admin-peak-runtime": "Giám sát & Nhật ký",
  "admin-observer-vps": "Giám sát & Nhật ký",

  "identity-security": "Bảo mật & Hạ tầng",
  "checkpoint-engine": "Bảo mật & Hạ tầng",
  "admin-azure-config": "Bảo mật & Hạ tầng",
  "admin-azure-manager": "Bảo mật & Hạ tầng",
};

/* ───────────────── component ───────────────── */
function Sidenav({ routes }) {
  const [controller, dispatchCtrl] = useMaterialUIController();
  const { miniSidenav } = controller;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutApi] = useLogoutMutation();
  const { userInfo } = useSelector((s) => s.auth || {});

  // Màn 992–1199px: tự thu gọn thanh bên (bản rút gọn của DreamsPOS). Dưới 992px thanh bên trượt ra/vào.
  useEffect(() => {
    function handleResize() {
      setMiniSidenav(dispatchCtrl, window.innerWidth < 1200);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatchCtrl]);

  // DreamsPOS điều khiển bố cục thu gọn bằng lớp trên <body>
  useEffect(() => {
    document.body.classList.toggle("mini-sidebar", Boolean(miniSidenav));
    return () => document.body.classList.remove("mini-sidebar");
  }, [miniSidenav]);

  // Đổi trang → đóng thanh bên dạng trượt (điện thoại)
  useEffect(() => {
    document.querySelector(".main-wrapper")?.classList.remove("slide-nav");
    document.querySelector(".sidebar-overlay")?.classList.remove("opened");
    document.documentElement.classList.remove("menu-opened");
  }, [location.pathname]);

  // Chỉ bung tạm khi thanh bên đang thu gọn — ở trạng thái mở sẵn thì không cần lớp expand-menu
  const expandMenuOpen = () => {
    if (document.body.classList.contains("mini-sidebar"))
      document.body.classList.add("expand-menu");
  };
  const expandMenu = () => document.body.classList.remove("expand-menu");

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (_) {
      // bỏ qua lỗi đăng xuất phía máy chủ
    }
    clearAllCookies();
    localStorage.removeItem("userInfo");
    dispatch(clearAuth());
    dispatch(apiSlice.util.resetApiState());
    navigate("/authentication/sign-in", { replace: true });
  };

  // Gom các mục hiển thị được vào nhóm rồi xếp theo GROUP_ORDER
  const visible = routes.filter(
    (r) => r.type === "collapse" && r.show !== false && canView(r, userInfo)
  );
  const buckets = new Map();
  visible.forEach((r) => {
    const g = KEY_GROUP[r.key] || "Khác";
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g).push(r);
  });
  const orderedGroups = [
    ...GROUP_ORDER.filter((g) => buckets.has(g)),
    ...[...buckets.keys()].filter((g) => !GROUP_ORDER.includes(g)),
  ];

  const renderItem = ({ name, icon, key, href, route }) => {
    const active = route
      ? location.pathname === route || location.pathname.startsWith(`${route}/`)
      : false;
    return (
      <li key={key} className={active ? "active" : ""}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" aria-label={`Mở ${name} trong tab mới`}>
            {icon}
            <span>{name}</span>
          </a>
        ) : (
          <NavLink to={route} className={active ? "active" : ""} aria-label={`Đi tới ${name}`}>
            {icon}
            <span>{name}</span>
          </NavLink>
        )}
      </li>
    );
  };

  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-inner slimscroll">
        <div
          id="sidebar-menu"
          className="sidebar-menu"
          onMouseOver={expandMenuOpen}
          onFocus={expandMenuOpen}
          onMouseLeave={expandMenu}
          onBlur={expandMenu}
        >
          <ul>
            {orderedGroups.map((group) => (
              <li className="submenu-open" key={`grp-${group}`}>
                <h6 className="submenu-hdr">{group}</h6>
                <ul>{buckets.get(group).map(renderItem)}</ul>
              </li>
            ))}
            <li className="submenu-open">
              <ul>
                <li>
                  <a
                    href="#dang-xuat"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                    data-no-command="true"
                    aria-label="Đăng xuất"
                  >
                    <Feather icon="log-out" />
                    <span>Đăng xuất</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

Sidenav.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
