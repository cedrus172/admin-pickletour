// layouts/var/VarCourtsPage.jsx — "Sân VAR": chuẩn bị sân trên máy phân tích trước ngày giải (job prepare) + soi thử.
// Sau khi chuẩn bị xong, tên sân trên máy phân tích được dùng cho mọi lần Soi VAR nhanh của camera đó (Pickletour Studio).
import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Stack, TextField, Typography } from "dreamspos/ui";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import {
  useCancelVarCourtMutation,
  useCreateVarCourtMutation,
  useDeleteVarCourtMutation,
  useGetVarChallengeQuery,
  useGetVarCourtsQuery,
  useTestVarCourtMutation,
} from "slices/varCourtAdminApiSlice";

const ACTIVE = ["uploading", "queued", "running"];
const pct = (v) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);
const fmt = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "");
const mb = (b) => `${(b / 1024 / 1024).toFixed(0)} MB`;
const DETECTOR = {
  active: "Bộ dò riêng: dùng cho mọi lần soi",
  challenge: "Bộ dò riêng: dùng cho soi VAR",
  rejected: "Bộ dò chung (bộ dò riêng không tốt hơn)",
  too_little: "Bộ dò chung (video không đủ hình bám bóng)",
  failed: "Bộ dò chung (luyện lỗi)",
};
const CALL = { in: "TRONG SÂN", out: "NGOÀI SÂN", net: "KHÔNG QUA LƯỚI", unsure: "SÁT VẠCH — MÁY KHÔNG PHÂN XỬ ĐƯỢC" };
const LINE = { left: "biên trái", right: "biên phải", far: "vạch cuối sân phía xa", near: "vạch cuối sân phía gần" };
const cm = (m) => {
  if (m === null || m === undefined) return "?";
  const v = Math.abs(m) * 100;
  return v >= 100 ? `${(v / 100).toFixed(2).replace(".", ",")} m` : `${Math.round(v)} cm`;
};
function describe(r) {
  const line = LINE[r.nearestLine] || "vạch";
  const unc = r.uncertaintyM !== null && r.uncertaintyM !== undefined ? `, sai số ±${cm(r.uncertaintyM)}` : "";
  if (r.call === "net") return "Bóng chạm sân ở phần sân của chính bên vừa đánh — không qua lưới.";
  if (r.call === "unsure") return `Bóng cách ${line} khoảng ${cm(r.marginM)}${unc} — trọng tài quyết định.`;
  if (r.call === "out") return `Ngoài ${cm(r.marginM)} (${line})${unc}.`;
  return `Trong ${cm(r.marginM)} (cách ${line})${unc}.`;
}

// Địa chỉ tải video lớn: nginx chỉ mở giới hạn 6 GB ở đúng đường /api/var/prepare-uploads.
const uploadUrl = () => String(process.env.REACT_APP_API_URL || "").replace(/\/api\/api\/?$/, "/api").replace(/\/+$/, "") + "/var/prepare-uploads";

function uploadPrepare({ token, courtId, label, file, onProgress }) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    if (courtId) form.append("courtId", courtId);
    else form.append("label", label);
    form.append("file", file, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl());
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded, e.total);
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(`${data.message || `Không tải được video (HTTP ${xhr.status})`}${data.hint ? ` ${data.hint}` : ""}`));
    };
    xhr.onerror = () => reject(new Error("Mất kết nối khi tải video"));
    xhr.send(form);
  });
}

function TestResult({ id }) {
  const [done, setDone] = React.useState(false);
  const { data } = useGetVarChallengeQuery(id, { pollingInterval: done ? 0 : 1500 });
  React.useEffect(() => {
    if (data && (data.status === "done" || data.status === "failed")) setDone(true);
  }, [data]);
  if (!data) return null;
  if (data.status === "failed")
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Soi thử: {data.error?.message} {data.error?.hint}
      </Alert>
    );
  if (data.status !== "done" || !data.result)
    return (
      <Typography variant="body2" sx={{ mt: 1 }}>
        Đang soi thử 25 giây giữa video chuẩn bị…
      </Typography>
    );
  const r = data.result;
  return (
    <Paper variant="outlined" sx={{ mt: 1, p: 1.5, borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Soi thử — {data.label}
      </Typography>
      <Typography fontWeight={900} sx={{ color: r.call === "in" ? "success.main" : r.call === "unsure" ? "warning.main" : "error.main" }}>
        {CALL[r.call] || r.call}
      </Typography>
      <Typography variant="body2">{describe(r)}</Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        {(data.zoomUrls || []).map((u) => (
          <a key={u} href={u} target="_blank" rel="noreferrer">
            <img src={u} alt="Ảnh phóng to chỗ bóng chạm sân" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 6 }} />
          </a>
        ))}
      </Stack>
      {data.replayUrl ? (
        <Button size="small" href={data.replayUrl} target="_blank" sx={{ mt: 1 }}>
          Xem đoạn mô phỏng
        </Button>
      ) : null}
    </Paper>
  );
}
TestResult.propTypes = { id: PropTypes.string.isRequired };

function CourtCard({ c, onUpload, uploading }) {
  const [cancel, { isLoading: cancelling }] = useCancelVarCourtMutation();
  const [remove] = useDeleteVarCourtMutation();
  const [test, { isLoading: testing }] = useTestVarCourtMutation();
  const [testId, setTestId] = React.useState(c.lastTestId || null);
  const fileRef = React.useRef(null);
  const p = c.prepare || {};
  const active = ACTIVE.includes(p.status);
  const chip = active
    ? { label: "Đang chuẩn bị", color: "info" }
    : c.ready
    ? { label: "Sẵn sàng", color: "success" }
    : p.status === "failed"
    ? { label: "Lỗi", color: "error" }
    : { label: "Chưa có video", color: "default" };
  const run = async (fn, ok) => {
    try {
      const r = await fn();
      if (ok) toast.success(ok);
      return r;
    } catch (e) {
      toast.error(e?.data?.message || e?.message || "Không thực hiện được");
      return null;
    }
  };
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography fontWeight={900}>{c.label}</Typography>
          <Chip size="small" color={chip.color} label={chip.label} />
          <Typography variant="caption" color="text.secondary">
            {c.owner?.name ? `của ${c.owner.name} · ` : ""}
            {fmt(c.updatedAt)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {c.canTest ? (
            <Button
              size="small"
              variant="outlined"
              disabled={testing}
              onClick={async () => {
                const r = await run(() => test({ id: c.id }).unwrap());
                if (r?.challenge?.id) setTestId(r.challenge.id);
              }}
            >
              Soi thử
            </Button>
          ) : null}
          {!active ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="video/*,.mkv,.ts"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) onUpload(c.id, null, f);
                }}
              />
              <Button size="small" variant="outlined" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {c.ready || p.status === "failed" ? "Gửi video khác" : "Gửi video"}
              </Button>
            </>
          ) : null}
          {active && p.status !== "uploading" ? (
            <Button size="small" color="warning" disabled={cancelling} onClick={() => run(() => cancel(c.id).unwrap(), "Đã huỷ chuẩn bị")}>
              Huỷ chuẩn bị
            </Button>
          ) : null}
          <Button
            size="small"
            color="error"
            onClick={() => window.confirm(`Xoá sân "${c.label}" khỏi PickleTour?`) && run(() => remove(c.id).unwrap(), "Đã xoá")}
          >
            Xoá
          </Button>
        </Stack>
      </Stack>

      {active ? (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            {p.stageText || "Đang chờ máy phân tích"}
            {p.progress !== null && p.progress !== undefined ? ` · ${pct(p.progress)}` : ""}
            {p.queue?.position > 0 ? ` · ${p.queue.position} việc đứng trước` : ""}
          </Typography>
          <LinearProgress variant="determinate" value={Math.round((p.progress || 0) * 100)} sx={{ my: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            Máy phân tích mất 1–3 giờ cho video 30 phút. Có thể rời trang và quay lại sau.
          </Typography>
        </Box>
      ) : null}

      {c.ready ? (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            Tên sân trên máy phân tích: <b>{c.analysisCourt}</b>
            {c.size ? ` · hình ${c.size.width}×${c.size.height}` : ""}
          </Typography>
          {c.detector ? <Typography variant="body2">{DETECTOR[c.detector.status] || c.detector.status}</Typography> : null}
          {c.detector?.message ? (
            <Typography variant="body2" color="text.secondary">
              “{c.detector.message}”
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            Thấy bóng: {pct(c.ballSeenBefore)} với bộ dò chung → {pct(c.ballSeenAfter)} sau khi luyện · vạch sân khớp {pct(c.courtLineShare)}
          </Typography>
        </Box>
      ) : null}
      {c.detectorWarning ? (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {c.detectorWarning}
        </Alert>
      ) : null}
      {p.status === "failed" && p.error ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {p.error.message} {p.error.hint}
          {p.error.detail ? ` (Máy phân tích báo: ${p.error.detail})` : ""}
        </Alert>
      ) : null}
      {p.video ? (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
          Video lần {p.attempt}: {p.video.name} · {Math.round(p.video.durationSec / 60)} phút · {p.video.width}×{p.video.height} · {mb(p.video.sizeBytes || 0)}
          {p.video.available ? "" : " · đã dọn khỏi máy chủ"}
        </Typography>
      ) : null}
      {testId ? <TestResult id={testId} /> : null}
    </Paper>
  );
}
CourtCard.propTypes = { c: PropTypes.object.isRequired, onUpload: PropTypes.func.isRequired, uploading: PropTypes.bool };

export default function VarCourtsPage() {
  const { userInfo } = useSelector((state) => state.auth || {});
  const { data, isLoading, refetch } = useGetVarCourtsQuery(undefined, { pollingInterval: 15000 });
  const [createCourt] = useCreateVarCourtMutation();
  const [label, setLabel] = React.useState("");
  const [upload, setUpload] = React.useState(null); // { sent, total, name }
  const newFileRef = React.useRef(null);
  const items = data?.items || [];

  const onUpload = async (courtId, newLabel, file) => {
    setUpload({ sent: 0, total: file.size, name: file.name });
    try {
      await uploadPrepare({
        token: userInfo?.token,
        courtId,
        label: newLabel,
        file,
        onProgress: (sent, total) => setUpload({ sent, total, name: file.name }),
      });
      toast.success("Đã gửi video — máy phân tích bắt đầu chuẩn bị sân");
      setLabel("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUpload(null);
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1100 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <SportsTennisIcon color="primary" />
          <Typography variant="h4">Sân VAR</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chuẩn bị sân trên máy phân tích trước ngày giải: gửi một video dài của đúng camera sân → máy học vạch sân và luyện bộ dò bóng riêng → tên sân
          dùng cho Soi VAR nhanh trong Pickletour Studio. Người dùng cũng tự chuẩn bị được trong Studio (Replay → Soi VAR nhanh → Chuẩn bị sân…).
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <b>Yêu cầu với video chuẩn bị:</b>
          <br />• Quay từ <b>đúng camera, vị trí, mức zoom và độ phân giải sẽ dùng ngày giải</b>. Vạch sân gắn với từng camera và kích thước hình — đổi một
          trong các thứ đó thì sân phải chuẩn bị lại.
          <br />• <b>Hình sạch</b>, không bảng điểm hay logo phủ lên.
          <br />• <b>Có người đánh thật gần như liên tục, 10–30 phút</b> (tối thiểu 2,5 phút), cùng loại bóng và ánh sáng với ngày giải.
          <br />• Máy mất khoảng 1–3 giờ cho video 30 phút — gửi trước ngày giải ít nhất nửa ngày.
        </Alert>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          <Typography fontWeight={800} sx={{ mb: 1 }}>
            Chuẩn bị sân mới
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField size="small" fullWidth label="Tên sân (ví dụ: Thành Nam — sân 3, camera góc cao)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <input
              ref={newFileRef}
              type="file"
              accept="video/*,.mkv,.ts"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onUpload(null, label.trim() || f.name, f);
              }}
            />
            <Button variant="contained" disabled={!!upload || !label.trim()} onClick={() => newFileRef.current?.click()} sx={{ color: "#fff !important", whiteSpace: "nowrap" }}>
              Chọn video và gửi
            </Button>
          </Stack>
          {upload ? (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2">
                Đang tải {upload.name}: {upload.total ? Math.round((upload.sent / upload.total) * 100) : 0}% ({mb(upload.sent)} / {mb(upload.total)}) — giữ trang mở tới khi
                tải xong.
              </Typography>
              <LinearProgress variant="determinate" value={upload.total ? (upload.sent / upload.total) * 100 : 0} />
            </Box>
          ) : null}
        </Paper>

        {isLoading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : items.length ? (
          <Stack spacing={1.5}>
            {items.map((c) => (
              <CourtCard key={c.id} c={c} onUpload={onUpload} uploading={!!upload} />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Chưa có sân VAR nào.
          </Typography>
        )}
      </Box>
    </DashboardLayout>
  );
}
