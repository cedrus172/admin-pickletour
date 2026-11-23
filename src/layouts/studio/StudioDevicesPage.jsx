// layouts/studio/StudioDevicesPage.jsx — "Thiết bị Studio": mọi máy đang chạy Pickletour Studio
// (Mac / Windows / iPhone / iPad / Android) gửi nhịp tim lên máy chủ; trang này hiện tình trạng kết nối,
// pin, nhiệt, mạng, CPU/RAM/ổ, trạng thái phát + đích phát, ghi hình, live theo sân và cảnh báo.
// API: GET /admin/studio/devices, GET/DELETE /admin/studio/devices/:id (backend controllers/studioDeviceController.js).
import React from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "dreamspos/ui";
import Icon from "@mui/material/Icon";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import ComputerIcon from "@mui/icons-material/Computer";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import TabletMacIcon from "@mui/icons-material/TabletMac";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import PowerIcon from "@mui/icons-material/Power";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import SpeedIcon from "@mui/icons-material/Speed";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import VideocamIcon from "@mui/icons-material/Videocam";
import ReplayIcon from "@mui/icons-material/Replay";
import SearchIcon from "@mui/icons-material/Search";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import {
  useDeleteStudioDeviceMutation,
  useGetStudioDeviceQuery,
  useGetStudioDevicesQuery,
} from "slices/studioAdminApiSlice";
import "./studioDevices.css";

const POLL_MS = 5000;

/* ───────── nhãn + định dạng ───────── */

const STATUS = {
  online: "Đang kết nối",
  unstable: "Chập chờn",
  offline: "Mất kết nối",
};
const PLATFORM = {
  mac: { label: "Mac", Icon: LaptopMacIcon },
  windows: { label: "Windows", Icon: DesktopWindowsIcon },
  linux: { label: "Linux", Icon: ComputerIcon },
  ios: { label: "iPhone", Icon: PhoneIphoneIcon },
  ipados: { label: "iPad", Icon: TabletMacIcon },
  android: { label: "Android", Icon: PhoneAndroidIcon },
};
const THERMAL = {
  nominal: { label: "Bình thường", tone: "" },
  fair: { label: "Hơi ấm", tone: "" },
  serious: { label: "Nóng", tone: "warn" },
  critical: { label: "Quá nóng", tone: "bad" },
};
const NETWORK = {
  wifi: { label: "Wi-Fi", Icon: WifiIcon },
  ethernet: { label: "Ethernet", Icon: SettingsEthernetIcon },
  cellular: { label: "4G/5G", Icon: SignalCellularAltIcon },
  none: { label: "Không có mạng", Icon: WifiOffIcon },
  unknown: { label: "Không rõ", Icon: WifiIcon },
};
const STREAM = {
  idle: { label: "Ngoài sóng", tone: "off" },
  starting: { label: "Đang bắt đầu", tone: "warn" },
  live: { label: "Đang phát", tone: "live" },
  reconnecting: { label: "Đang kết nối lại", tone: "warn" },
  error: { label: "Lỗi phát", tone: "bad" },
};
const TARGET_STATE = {
  live: { label: "Đang phát", tone: "ok" },
  connecting: { label: "Đang kết nối", tone: "warn" },
  reconnecting: { label: "Kết nối lại", tone: "warn" },
  failed: { label: "Lỗi", tone: "bad" },
  idle: { label: "Chờ", tone: "off" },
};
const TARGET_KIND = { facebook: "Facebook", youtube: "YouTube", rtmp: "RTMP", srt: "SRT" };
const COURT_PHASE = { waiting: "Chờ trận", live: "Đang đấu", finished: "Đã xong" };

const errText = (e, fallback) => e?.data?.message || e?.error || fallback;
const nf = (n, d = 0) =>
  Number(n).toLocaleString("vi-VN", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const pct = (r) => (r == null ? null : Math.round(r * 100));

function agoText(sec) {
  if (sec == null) return "chưa rõ";
  if (sec < 5) return "vừa xong";
  if (sec < 60) return `${sec} giây trước`;
  if (sec < 3600) return `${Math.floor(sec / 60)} phút trước`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} giờ trước`;
  return `${Math.floor(sec / 86400)} ngày trước`;
}
function clock(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = (x) => String(x).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(r)}` : `${m}:${p(r)}`;
}
const kbps = (v) => (v == null ? "—" : v >= 1000 ? `${nf(v / 1000, 1)} Mb/s` : `${nf(v)} kb/s`);
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
const userLabel = (u) => u?.nickname || u?.name || "(không tên)";

/** Đồng hồ cục bộ chạy mỗi giây (để "x giây trước" tự tăng giữa hai lần tải). */
function useNow(ms = 1000) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Số giây kể từ nhịp cuối, đã bù lệch giờ máy chủ ↔ trình duyệt. */
const secondsAgo = (lastSeenAt, now, offsetMs) =>
  lastSeenAt ? Math.max(0, Math.round((now + offsetMs - new Date(lastSeenAt).getTime()) / 1000)) : null;

/* ───────── mảnh giao diện ───────── */

function StatusPill({ status }) {
  return (
    <span className={`sdv-pill st-${status}`}>
      <span className="sdv-dot" />
      {STATUS[status] || status}
    </span>
  );
}
StatusPill.propTypes = { status: PropTypes.string.isRequired };

function PlatformIcon({ platform }) {
  const P = PLATFORM[platform]?.Icon || ComputerIcon;
  return (
    <span className="sdv-icon">
      <P />
    </span>
  );
}
PlatformIcon.propTypes = { platform: PropTypes.string };

function Metric({ icon, label, value, sub, tone, bar, barTone, title }) {
  return (
    <div className="sdv-metric" title={title}>
      <div className="sdv-mlabel">
        {icon}
        {label}
      </div>
      <div className={`sdv-mvalue ${tone || ""}`}>
        {value}
        {sub ? <small> {sub}</small> : null}
      </div>
      {bar != null ? (
        <div className="sdv-bar">
          <span className={barTone || ""} style={{ width: `${Math.max(2, Math.min(100, bar))}%` }} />
        </div>
      ) : null}
    </div>
  );
}
Metric.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  sub: PropTypes.node,
  tone: PropTypes.string,
  bar: PropTypes.number,
  barTone: PropTypes.string,
  title: PropTypes.string,
};

function BatteryMetric({ battery }) {
  if (!battery || battery.level == null) {
    return (
      <Metric
        icon={<PowerIcon />}
        label="Nguồn"
        value="Cắm điện"
        sub={battery?.charging ? "đang sạc" : ""}
        title="Máy không có pin (hoặc không báo mức pin)"
      />
    );
  }
  const p = pct(battery.level);
  const low = p <= 20 && !battery.charging;
  const tone = low ? "bad" : p <= 35 && !battery.charging ? "warn" : "";
  return (
    <Metric
      icon={battery.charging ? <BatteryChargingFullIcon /> : <BatteryFullIcon />}
      label={battery.charging ? "Pin · đang sạc" : battery.lowPower ? "Pin · tiết kiệm pin" : "Pin"}
      value={
        <>
          {p}%
          {battery.lowPower ? (
            <Tooltip title="Chế độ tiết kiệm pin đang bật">
              <EnergySavingsLeafIcon
                sx={{ fontSize: "15px !important", ml: 0.5, verticalAlign: "-2px", color: "#28c76f" }}
              />
            </Tooltip>
          ) : null}
        </>
      }
      tone={tone}
      bar={p}
      barTone={tone}
    />
  );
}
BatteryMetric.propTypes = { battery: PropTypes.object };

function Metrics({ last }) {
  const th = THERMAL[last?.thermal];
  const net = NETWORK[last?.network?.type] || null;
  const NetIcon = net?.Icon || WifiIcon;
  const rtt = last?.network?.rttMs;
  const cpu = pct(last?.cpu?.usage);
  const mem = last?.memory;
  const disk = last?.disk;
  const memPct = mem?.usedMB != null && mem?.totalMB ? Math.round((mem.usedMB / mem.totalMB) * 100) : null;
  const diskLow = disk?.freeGB != null && disk.freeGB < 10;
  return (
    <div className="sdv-metrics">
      <BatteryMetric battery={last?.battery} />
      <Metric
        icon={<ThermostatIcon />}
        label="Nhiệt độ"
        value={th ? th.label : "Không đo"}
        tone={th?.tone}
      />
      <Metric
        icon={<NetIcon />}
        label={net ? net.label : "Mạng"}
        value={rtt != null ? `${nf(rtt)} ms` : "—"}
        sub={rtt != null ? "độ trễ" : ""}
        tone={rtt != null && rtt > 800 ? "warn" : ""}
      />
      <Metric
        icon={<SpeedIcon />}
        label={last?.cpuScope === "app" ? "CPU (app)" : "CPU"}
        value={cpu != null ? `${cpu}%` : "—"}
        bar={cpu}
        barTone={cpu != null && cpu >= 90 ? "bad" : cpu != null && cpu >= 75 ? "warn" : ""}
      />
      <Metric
        icon={<MemoryIcon />}
        label="RAM"
        value={
          mem?.usedMB != null && mem?.totalMB
            ? `${nf(mem.usedMB / 1024, 1)}/${nf(mem.totalMB / 1024, 0)} GB`
            : mem?.appMB != null
            ? `${nf(mem.appMB)} MB`
            : "—"
        }
        sub={mem?.appMB != null && mem?.usedMB != null ? `app ${nf(mem.appMB)} MB` : mem?.appMB != null ? "app" : ""}
        bar={memPct}
        barTone={memPct != null && memPct >= 90 ? "warn" : ""}
      />
      <Metric
        icon={<StorageIcon />}
        label="Ổ trống"
        value={disk?.freeGB != null ? `${nf(disk.freeGB, disk.freeGB < 10 ? 1 : 0)} GB` : "—"}
        sub={disk?.totalGB ? `/ ${nf(disk.totalGB, 0)} GB` : ""}
        tone={diskLow ? "warn" : ""}
      />
    </div>
  );
}
Metrics.propTypes = { last: PropTypes.object };

function StreamBlock({ last, now, offsetMs }) {
  const s = last?.stream;
  const st = STREAM[s?.state] || STREAM.idle;
  const active = s && s.state && s.state !== "idle";
  const rec = last?.recording;
  const court = last?.courtLive;
  const src = last?.sources;
  const recSec = rec?.active && rec.startedAt ? Math.round((now + offsetMs - rec.startedAt) / 1000) : null;
  return (
    <div className="sdv-stream">
      <div className="sdv-stream-row">
        <span className={`sdv-tag ${st.tone}`}>
          {s?.state === "live" ? <FiberManualRecordIcon sx={{ fontSize: "10px !important" }} /> : null}
          {st.label}
        </span>
        {active && s.uptimeSec != null ? (
          <span className="sdv-kv">
            <b>{clock(s.uptimeSec)}</b>
          </span>
        ) : null}
        {active && s.bitrateKbps != null ? (
          <span className="sdv-kv">
            bitrate <b>{kbps(s.bitrateKbps)}</b>
          </span>
        ) : null}
        {active && s.droppedFrames != null ? (
          <span className="sdv-kv">
            rớt khung <b>{nf(s.droppedFrames)}</b>
          </span>
        ) : null}
        {active && (s.resolution || s.fps != null) ? (
          <span className="sdv-kv">
            <b>
              {s.resolution || "—"}
              {s.fps != null ? ` · ${nf(s.fps, 0)} fps` : ""}
            </b>
          </span>
        ) : null}
      </div>
      {s?.targets?.length ? (
        <div className="sdv-targets">
          {s.targets.map((t, i) => {
            const ts = TARGET_STATE[t.state] || { label: "—", tone: "off" };
            return (
              // eslint-disable-next-line react/no-array-index-key
              <div className="sdv-target" key={`${t.kind}-${t.name}-${i}`}>
                <VideocamIcon sx={{ fontSize: "15px !important", color: "var(--dp-sub)" }} />
                <span className="sdv-tname">
                  {t.name || TARGET_KIND[t.kind] || "Đích phát"}
                  {t.name && TARGET_KIND[t.kind] ? (
                    <span style={{ color: "var(--dp-sub)" }}> · {TARGET_KIND[t.kind]}</span>
                  ) : null}
                </span>
                {t.error ? (
                  <Tooltip title={t.error}>
                    <span className="sdv-terr">{t.error}</span>
                  </Tooltip>
                ) : null}
                <span className={`sdv-tag ${ts.tone}`}>{ts.label}</span>
              </div>
            );
          })}
        </div>
      ) : null}
      {s?.message ? <div className="sdv-msg">{s.message}</div> : null}
      <div className="sdv-foot">
        {rec?.active ? (
          <span className="sdv-rec">
            <FiberManualRecordIcon />
            Đang ghi hình{recSec != null && recSec >= 0 ? ` ${clock(recSec)}` : ""}
          </span>
        ) : (
          <span>
            <FiberManualRecordIcon sx={{ opacity: 0.4 }} />
            Không ghi hình
          </span>
        )}
        {court?.active ? (
          <span title="Live theo sân">
            <SportsTennisIcon />
            {[court.clusterName, court.stationName, court.matchCode, COURT_PHASE[court.phase]]
              .filter(Boolean)
              .join(" · ") || "Live theo sân"}
          </span>
        ) : null}
        {src?.total != null ? (
          <span title="Nguồn có hình / tổng số nguồn">
            <VideocamIcon />
            {src.withPicture ?? 0}/{src.total} nguồn có hình
            {src.cameras ? ` · ${src.cameras} camera` : ""}
          </span>
        ) : null}
        {last?.replay?.bufferSec ? (
          <span title="Bộ đệm replay">
            <ReplayIcon />
            Replay {clock(last.replay.bufferSec)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
StreamBlock.propTypes = { last: PropTypes.object, now: PropTypes.number, offsetMs: PropTypes.number };

function LicenseTag({ license }) {
  if (license?.admin) return <span className="sdv-tag ok">Quản trị viên</span>;
  if (license?.allowed) return <span className="sdv-tag ok">Đã cấp quyền Studio</span>;
  const why = { disabled: "Quyền đang tắt", expired: "Quyền hết hạn" }[license?.reason];
  return <span className="sdv-tag off">{why || "Chưa cấp quyền Studio"}</span>;
}
LicenseTag.propTypes = { license: PropTypes.object };

function DeviceHeader({ d, ago }) {
  const sub = [
    d.model || PLATFORM[d.platform]?.label,
    d.osVersion,
    d.appVersion ? `Studio ${d.appVersion}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="sdv-head">
      <PlatformIcon platform={d.platform} />
      <div className="sdv-title">
        <div className="sdv-name" title={d.deviceName || d.deviceId}>
          {d.deviceName || PLATFORM[d.platform]?.label || "Thiết bị"}
        </div>
        <div className="sdv-sub" title={sub}>
          {sub || "—"}
        </div>
      </div>
      <div className="sdv-status">
        <StatusPill status={d.status} />
        <div style={{ marginTop: 4 }}>{agoText(ago)}</div>
      </div>
    </div>
  );
}
DeviceHeader.propTypes = { d: PropTypes.object.isRequired, ago: PropTypes.number };

function Warnings({ warnings }) {
  const rest = (warnings || []).filter((w) => w.code !== "suspect_drop");
  if (!rest.length) return null;
  return (
    <div className="sdv-warns">
      {rest.map((w) => (
        <span key={w.code} className={`sdv-tag ${w.level === "danger" ? "bad" : "warn"}`}>
          {w.text}
        </span>
      ))}
    </div>
  );
}
Warnings.propTypes = { warnings: PropTypes.array };

function StaleNote({ d }) {
  if (d.status !== "offline" || !d.lastSeenAt) return null;
  return (
    <div className="sdv-stale">
      Số liệu lúc nhịp cuối · {new Date(d.lastSeenAt).toLocaleString("vi-VN", { hour12: false })}
    </div>
  );
}
StaleNote.propTypes = { d: PropTypes.object.isRequired };

function DeviceCard({ d, now, offsetMs, onOpen }) {
  const ago = secondsAgo(d.lastSeenAt, now, offsetMs);
  const open = () => onOpen(d.id);
  return (
    <Card
      className={`sdv-card${d.suspectDrop ? " is-drop" : ""}${d.status === "offline" ? " is-offline" : ""}`}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      {d.suspectDrop ? (
        <div className="sdv-alert-drop">
          <ErrorOutlineIcon fontSize="small" />
          Có thể đã rớt khi đang phát
        </div>
      ) : null}
      <DeviceHeader d={d} ago={ago} />
      <div className="sdv-user">
        <Avatar src={d.user?.avatar || undefined} sx={{ width: 22, height: 22 }} />
        <span className="sdv-uname" title={d.user?.name || ""}>
          {d.user ? userLabel(d.user) : "(tài khoản đã xoá)"}
        </span>
        <LicenseTag license={d.license} />
      </div>
      <Warnings warnings={d.warnings} />
      <div className="sdv-body">
        <StaleNote d={d} />
        <Metrics last={d.last} />
        <StreamBlock last={d.last} now={now} offsetMs={offsetMs} />
      </div>
    </Card>
  );
}
DeviceCard.propTypes = {
  d: PropTypes.object.isRequired,
  now: PropTypes.number.isRequired,
  offsetMs: PropTypes.number.isRequired,
  onOpen: PropTypes.func.isRequired,
};

/* ───────── biểu đồ nhỏ (SVG, không thư viện) ───────── */

function Sparkline({ label, points, color, format, fixedMax, now }) {
  const W = 300;
  const H = 52;
  const end = now;
  // Trục thời gian: tối đa 1 giờ, tối thiểu 10 phút (máy mới kết nối thì đường không bị dồn sát mép phải).
  const firstT = points.length ? points[0].t : end;
  const start = Math.max(end - 60 * 60 * 1000, Math.min(firstT, end - 10 * 60 * 1000));
  const vals = points.filter((p) => p.v != null && p.t >= start);
  const latest = vals.length ? vals[vals.length - 1].v : null;
  const lo = vals.length ? Math.min(...vals.map((p) => p.v)) : 0;
  const hi = vals.length ? Math.max(...vals.map((p) => p.v)) : 0;
  const yMax = fixedMax ?? (hi > 0 ? hi * 1.15 : 1);
  const x = (t) => ((t - start) / (end - start)) * W;
  const y = (v) => H - 3 - (Math.max(0, v) / yMax) * (H - 8);
  // Tách đoạn khi thiếu số hoặc hai điểm cách nhau > 60 giây (mất kết nối).
  const segs = [];
  let cur = [];
  let prevT = null;
  for (const p of points.filter((x) => x.t >= start)) {
    if (p.v == null || (prevT != null && p.t - prevT > 60000)) {
      if (cur.length) segs.push(cur);
      cur = [];
    }
    if (p.v != null) cur.push(p);
    prevT = p.t;
  }
  if (cur.length) segs.push(cur);
  return (
    <div className="sdv-spark">
      <div className="sdv-spark-head">
        <span>
          {label}: <b>{latest == null ? "—" : format(latest)}</b>
        </span>
        <span>{vals.length > 1 ? `thấp ${format(lo)} · cao ${format(hi)}` : ""}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
        {segs.map((seg) => {
          const line = seg.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
          const area =
            seg.length > 1
              ? `M${x(seg[0].t).toFixed(1)},${H} L${line.replace(/ /g, " L")} L${x(seg[seg.length - 1].t).toFixed(1)},${H} Z`
              : "";
          return (
            <g key={seg[0].t}>
              {area ? <path d={area} fill={color} fillOpacity="0.12" /> : null}
              {seg.length > 1 ? (
                <polyline
                  points={line}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              ) : (
                <circle cx={x(seg[0].t)} cy={y(seg[0].v)} r="2.5" fill={color} />
              )}
            </g>
          );
        })}
        {!vals.length ? (
          <text x={W / 2} y={H / 2 + 4} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.5">
            Chưa có số liệu
          </text>
        ) : null}
      </svg>
    </div>
  );
}
Sparkline.propTypes = {
  label: PropTypes.string.isRequired,
  points: PropTypes.array.isRequired,
  color: PropTypes.string.isRequired,
  format: PropTypes.func.isRequired,
  fixedMax: PropTypes.number,
  now: PropTypes.number.isRequired,
};

/* ───────── ngăn chi tiết ───────── */

function eventTime(t) {
  const d = new Date(t);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("vi-VN", { hour12: false })
    : d.toLocaleString("vi-VN", { hour12: false, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function DeviceDrawer({ id, onClose, paused, now, fallback }) {
  const { data, isLoading, isError, fulfilledTimeStamp } = useGetStudioDeviceQuery(id, {
    skip: !id,
    pollingInterval: paused ? 0 : POLL_MS,
  });
  const [del, { isLoading: deleting }] = useDeleteStudioDeviceMutation();
  const [confirm, setConfirm] = React.useState(false);
  const d = data && data.id === id ? data : fallback;
  const offsetMs =
    data?.serverTime && fulfilledTimeStamp ? Date.parse(data.serverTime) - fulfilledTimeStamp : 0;
  const ago = d ? secondsAgo(d.lastSeenAt, now, offsetMs) : null;
  const history = React.useMemo(
    () => (data?.history || []).map((p) => ({ ...p, t: new Date(p.t).getTime() })),
    [data?.history]
  );
  const series = (key, mul = 1) => history.map((p) => ({ t: p.t, v: p[key] == null ? null : p[key] * mul }));

  const forget = async () => {
    try {
      await del(id).unwrap();
      toast.success("Đã quên thiết bị. Máy còn chạy Studio sẽ hiện lại ở nhịp tim sau.");
      setConfirm(false);
      onClose();
    } catch (e) {
      toast.error(errText(e, "Không quên được thiết bị"));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={!!id}
      onClose={onClose}
      // Theme gán sẵn cho MuiDrawer kiểu thanh bên (nowrap, lề 16px, bo góc) → trả về ngăn phải bình thường.
      sx={{ whiteSpace: "normal" }}
      PaperProps={{
        sx: {
          bgcolor: "var(--dp-card)",
          backgroundImage: "none",
          width: { xs: "100%", sm: 480 },
          maxWidth: "100vw",
          height: "100%",
          m: 0,
          borderRadius: 0,
          whiteSpace: "normal",
          overflowX: "hidden",
        },
      }}
    >
      <div className="sdv-page sdv-drawer" style={{ width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: "var(--dp-text)" }}>
            Chi tiết thiết bị
          </Typography>
          <IconButton onClick={onClose} aria-label="Đóng">
            <CloseIcon />
          </IconButton>
        </Box>
        {!d && isLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : null}
        {isError && !d ? <Alert severity="error">Không tải được thiết bị (có thể đã bị quên).</Alert> : null}
        {d ? (
          <>
            {d.suspectDrop ? (
              <Alert severity="error" sx={{ mb: 1.5 }}>
                Có thể đã rớt khi đang phát — máy im lặng {agoText(ago).replace(" trước", "")} trong lúc đang
                phát / ghi hình.
              </Alert>
            ) : null}
            <DeviceHeader d={d} ago={ago} />
            <div className="sdv-user">
              <Avatar src={d.user?.avatar || undefined} sx={{ width: 22, height: 22 }} />
              <span className="sdv-uname">{d.user ? userLabel(d.user) : "(tài khoản đã xoá)"}</span>
              <LicenseTag license={d.license} />
            </div>
            <Warnings warnings={d.warnings} />
            <div className={d.status === "offline" ? "sdv-body is-stale" : "sdv-body"}>
              <StaleNote d={d} />
              <Metrics last={d.last} />
              <StreamBlock last={d.last} now={now} offsetMs={offsetMs} />
            </div>

            <h6 className="sdv-sec">1 giờ qua</h6>
            <Sparkline
              label="Pin"
              points={series("battery", 100)}
              color="#28c76f"
              format={(v) => `${Math.round(v)}%`}
              fixedMax={100}
              now={now + offsetMs}
            />
            <Sparkline
              label="Bitrate"
              points={series("bitrateKbps")}
              color="#ff9f43"
              format={kbps}
              now={now + offsetMs}
            />
            <Sparkline
              label="Độ trễ mạng"
              points={series("rttMs")}
              color="#7367f0"
              format={(v) => `${nf(v)} ms`}
              now={now + offsetMs}
            />

            <h6 className="sdv-sec">Sự kiện gần đây</h6>
            {data?.events?.length ? (
              <ul className="sdv-events">
                {data.events.map((e, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={`${e.t}-${e.type}-${i}`} className={`lv-${e.level}`}>
                    <time>{eventTime(e.t)}</time>
                    <span className="sdv-dot" />
                    <span className="sdv-etext">{e.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Typography variant="body2" sx={{ color: "var(--dp-sub)" }}>
                {data ? "Chưa có sự kiện nào." : "Đang tải…"}
              </Typography>
            )}

            <h6 className="sdv-sec">Thông tin</h6>
            <dl className="sdv-info">
              <dt>Tài khoản</dt>
              <dd>
                {d.user ? userLabel(d.user) : "—"}
                {d.user?.name && d.user?.nickname && d.user.name !== d.user.nickname ? ` (${d.user.name})` : ""}
                {d.user?.phone || d.user?.email ? (
                  <div style={{ color: "var(--dp-sub)", fontSize: 12 }}>
                    {[d.user.phone, d.user.email].filter(Boolean).join(" · ")}
                  </div>
                ) : null}
              </dd>
              <dt>Địa chỉ IP</dt>
              <dd>{d.ip ? <code>{d.ip}</code> : "—"}</dd>
              <dt>Mã thiết bị</dt>
              <dd>
                <code>{d.deviceId}</code>
              </dd>
              <dt>Bản app</dt>
              <dd>
                {d.appVersion || "—"}
                {d.appBuild ? ` (build ${d.appBuild})` : ""}
              </dd>
              <dt>Lần đầu thấy</dt>
              <dd>{fmtDateTime(d.firstSeenAt)}</dd>
              <dt>Lần cuối thấy</dt>
              <dd>{fmtDateTime(d.lastSeenAt)}</dd>
              <dt>Lần cuối phát</dt>
              <dd>{fmtDateTime(d.lastLiveAt)}</dd>
            </dl>

            <Box sx={{ mt: 3, pb: 2 }}>
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setConfirm(true)}
              >
                Quên thiết bị
              </Button>
            </Box>
          </>
        ) : null}
      </div>
      <Dialog open={confirm} onClose={() => setConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Quên thiết bị này?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Xoá thiết bị «{d?.deviceName || d?.deviceId}» cùng lịch sử và sự kiện khỏi danh sách. Nếu máy vẫn
            đang mở Pickletour Studio, thiết bị sẽ hiện lại ở nhịp tim tiếp theo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Huỷ</Button>
          <Button color="error" variant="contained" onClick={forget} disabled={deleting}>
            Quên thiết bị
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
DeviceDrawer.propTypes = {
  id: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  paused: PropTypes.bool,
  now: PropTypes.number.isRequired,
  fallback: PropTypes.object,
};

/* ───────── trang ───────── */

export default function StudioDevicesPage() {
  const [status, setStatus] = React.useState("all");
  const [keyword, setKeyword] = React.useState("");
  const [q, setQ] = React.useState("");
  const [paused, setPaused] = React.useState(false);
  const [openId, setOpenId] = React.useState(null);
  const now = useNow(1000);

  React.useEffect(() => {
    const t = setTimeout(() => setQ(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  const { data, isLoading, isFetching, isError, refetch, fulfilledTimeStamp } = useGetStudioDevicesQuery(
    { status, q },
    { pollingInterval: paused ? 0 : POLL_MS, refetchOnFocus: true }
  );
  const items = data?.items || [];
  const sum = data?.summary || { total: 0, online: 0, unstable: 0, offline: 0, live: 0, warnings: 0 };
  const offsetMs = data?.serverTime && fulfilledTimeStamp ? Date.parse(data.serverTime) - fulfilledTimeStamp : 0;
  const updatedAgo = fulfilledTimeStamp ? Math.max(0, Math.round((now - fulfilledTimeStamp) / 1000)) : null;

  const filterBtn = (value, label, count) => (
    <ToggleButton value={value}>
      {label}
      {count != null ? <span style={{ marginLeft: 6, opacity: 0.7 }}>{count}</span> : null}
    </ToggleButton>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box className="sdv-page" sx={{ p: { xs: 1.5, md: 3 } }}>
        <Typography variant="h5" fontWeight={800}>
          Thiết bị Studio
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Các máy đang chạy Pickletour Studio (Mac, Windows, iPhone, iPad, Android) gửi nhịp tim mỗi{" "}
          {data?.intervalSec || 15} giây: tình trạng kết nối, pin, nhiệt độ, mạng và trạng thái phát.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <ComplexStatisticsCard color="primary" icon={<Icon>devices</Icon>} title="Tổng thiết bị" count={sum.total} />
          </Grid>
          <Grid item xs={6} md={3}>
            <ComplexStatisticsCard
              color="success"
              icon={<Icon>wifi</Icon>}
              title="Đang kết nối"
              count={sum.online}
              percentage={sum.unstable ? { color: "warning", amount: sum.unstable, label: "chập chờn" } : undefined}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <ComplexStatisticsCard color="error" icon={<Icon>sensors</Icon>} title="Đang phát" count={sum.live} />
          </Grid>
          <Grid item xs={6} md={3}>
            <ComplexStatisticsCard
              color="warning"
              icon={<Icon>warning_amber</Icon>}
              title="Cảnh báo"
              count={sum.warnings}
            />
          </Grid>
        </Grid>

        <div className="sdv-toolbar">
          <div className="sdv-filter">
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={status}
              onChange={(_, v) => v && setStatus(v)}
            >
              {filterBtn("all", "Tất cả", sum.total)}
              {filterBtn("online", "Đang kết nối", sum.online)}
              {filterBtn("unstable", "Chập chờn", sum.unstable)}
              {filterBtn("offline", "Mất kết nối", sum.offline)}
            </ToggleButtonGroup>
          </div>
          <TextField
            className="sdv-search"
            size="small"
            placeholder="Tìm tên máy, model, tài khoản"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <div className="sdv-refresh">
            <span>
              {paused ? "Đã tạm dừng tự làm mới" : `Tự làm mới 5 giây${updatedAgo != null ? ` · ${agoText(updatedAgo)}` : ""}`}
            </span>
            <Tooltip title={paused ? "Tiếp tục tự làm mới" : "Tạm dừng tự làm mới"}>
              <IconButton size="small" onClick={() => setPaused((p) => !p)} aria-label="Tự làm mới">
                {paused ? <PlayArrowIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Làm mới ngay">
              <span>
                <IconButton size="small" onClick={refetch} disabled={isFetching} aria-label="Làm mới ngay">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        </div>

        {isLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : null}
        {isError ? (
          <Alert severity="error" action={<Button onClick={refetch}>Thử lại</Button>} sx={{ mb: 2 }}>
            Không tải được danh sách thiết bị.
          </Alert>
        ) : null}
        {!isLoading && !isError && !items.length ? (
          <Card className="sdv-empty">
            {q || status !== "all"
              ? "Không có thiết bị nào khớp bộ lọc."
              : "Chưa có thiết bị nào gửi nhịp tim. Thiết bị hiện ở đây khi Pickletour Studio đang mở và đăng nhập tài khoản PickleTour."}
          </Card>
        ) : null}

        <div className="sdv-grid">
          {items.map((d) => (
            <DeviceCard key={d.id} d={d} now={now} offsetMs={offsetMs} onOpen={setOpenId} />
          ))}
        </div>
      </Box>
      <DeviceDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        paused={paused}
        now={now}
        fallback={items.find((x) => x.id === openId) || null}
      />
    </DashboardLayout>
  );
}
