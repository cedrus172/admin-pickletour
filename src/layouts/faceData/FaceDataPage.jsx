// layouts/faceData/FaceDataPage.jsx
// Dữ liệu "Tra cứu ảnh VĐV": kéo & cập nhật dữ liệu từng nguồn (SportConnect, PickleballVN, PVNA, PickleTour), quét ảnh đại diện,
// reindex lại toàn bộ avatar.
import React from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "dreamspos/ui";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ReplayIcon from "@mui/icons-material/Replay";
import FaceRetouchingNaturalIcon from "@mui/icons-material/FaceRetouchingNatural";
import StopIcon from "@mui/icons-material/Stop";
import KeyIcon from "@mui/icons-material/Key";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useCreateFaceWorkerKeyMutation, useGetFaceSourcesQuery, useRunFaceSourceMutation } from "slices/faceDataApiSlice";

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
const COLOR = { spc: "#2563eb", pbvn: "#16a34a", pvna: "#ea580c", pt: "#0891b2" };
const STATUS = {
  idle: { label: "Chưa chạy", color: "default" },
  pulling: { label: "Đang kéo dữ liệu", color: "info" },
  indexing: { label: "Đang quét ảnh", color: "warning" },
  done: { label: "Đã xong", color: "success" },
  failed: { label: "Lỗi", color: "error" },
  stopped: { label: "Đã dừng", color: "default" },
};

function Stat({ label, value, sub }) {
  return (
    <Box sx={{ flex: "1 1 120px" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={800}>
        {value}
      </Typography>
      {sub ? (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      ) : null}
    </Box>
  );
}
Stat.propTypes = { label: PropTypes.node, value: PropTypes.node, sub: PropTypes.node };

function SourceCard({ s, onRun, running }) {
  const busy = s.status === "pulling" || s.status === "indexing";
  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
  const st = STATUS[s.status] || STATUS.idle;
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderLeft: `6px solid ${COLOR[s.source] || "#64748b"}` }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip label={s.label} sx={{ bgcolor: COLOR[s.source], color: "#fff !important", fontWeight: 800 }} />
          <Chip
            size="small"
            color={st.color}
            label={st.label + (busy && s.mode === "reindex" ? " (reindex toàn bộ)" : "") + (busy && s.runner === "windows" ? " · máy Windows" : "")}
            variant={busy ? "filled" : "outlined"}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
          {s.url}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
        <Stat label="VĐV trong dữ liệu" value={fmt(s.rows)} sub={s.source === "pt" ? `${fmt(s.withAvatar)} ảnh (đại diện + CCCD)` : `${fmt(s.withAvatar)} có ảnh đại diện`} />
        <Stat label="Đã có mã khuôn mặt" value={fmt(s.faces)} sub="dùng để tra cứu" />
        <Stat
          label="Lần kéo dữ liệu gần nhất"
          value={<span style={{ fontSize: 16 }}>{fmtDate(s.pulledAt)}</span>}
          sub={s.added != null ? `+${fmt(s.added)} mới · ${fmt(s.updated)} đổi · −${fmt(s.removed)} bỏ` : ""}
        />
        <Stat label="Quét ảnh xong lúc" value={<span style={{ fontSize: 16 }}>{fmtDate(s.finishedAt)}</span>} sub={s.startedAt ? `bắt đầu ${fmtDate(s.startedAt)}` : ""} />
      </Stack>

      {busy ? (
        <Box sx={{ mt: 2 }}>
          {s.status === "pulling" ? (
            <>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Đang tải và cập nhật dữ liệu…
              </Typography>
              <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Đang quét ảnh đại diện: {fmt(s.done)}/{fmt(s.total)} ({pct}%) — vẫn tra cứu được trong lúc quét.
              </Typography>
              <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
            </>
          )}
        </Box>
      ) : null}
      {s.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {s.error}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          startIcon={running === `${s.source}:sync` ? <CircularProgress size={16} color="inherit" /> : <CloudDownloadIcon />}
          disabled={busy || !!running}
          onClick={() => onRun(s, "sync")}
          sx={{ color: "#fff !important" }}
        >
          Kéo & cập nhật dữ liệu
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={running === `${s.source}:reindex` ? <CircularProgress size={16} /> : <ReplayIcon />}
          disabled={busy || !!running}
          onClick={() => onRun(s, "reindex")}
        >
          Reindex toàn bộ avatar
        </Button>
        {busy ? (
          <Button
            variant="outlined"
            color="error"
            startIcon={running === `${s.source}:stop` ? <CircularProgress size={16} /> : <StopIcon />}
            disabled={!!running}
            onClick={() => onRun(s, "stop")}
          >
            Dừng
          </Button>
        ) : null}
      </Stack>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
        &quot;Kéo & cập nhật&quot; tải lại file nguồn, thêm/sửa/xoá VĐV rồi chỉ quét ảnh VĐV mới hoặc đổi ảnh. &quot;Reindex&quot; kéo dữ liệu rồi quét lại
        tất cả ảnh đại diện (lâu: khoảng 1 ảnh/giây).
      </Typography>
    </Paper>
  );
}
SourceCard.propTypes = { s: PropTypes.object.isRequired, onRun: PropTypes.func.isRequired, running: PropTypes.string };

export default function FaceDataPage() {
  const [poll, setPoll] = React.useState(0);
  const { data, isLoading, error, refetch } = useGetFaceSourcesQuery(undefined, { pollingInterval: poll });
  const [run] = useRunFaceSourceMutation();
  const [running, setRunning] = React.useState("");
  const [confirm, setConfirm] = React.useState(null);
  const sources = data?.sources || [];
  const anyBusy = sources.some((s) => s.status === "pulling" || s.status === "indexing");

  React.useEffect(() => setPoll(anyBusy ? 4000 : 0), [anyBusy]);

  const [createKey, { isLoading: creatingKey }] = useCreateFaceWorkerKeyMutation();
  const [newKey, setNewKey] = React.useState("");
  const doRun = async (s, mode) => {
    setRunning(`${s.source}:${mode}`);
    try {
      await run({ source: s.source, mode }).unwrap();
      toast.success(mode === "stop" ? `Đã dừng ${s.label}` : mode === "reindex" ? `Đã bắt đầu reindex ${s.label}` : `Đang kéo dữ liệu ${s.label}`);
      setPoll(4000);
    } catch (e) {
      toast.error(e?.data?.message || "Không chạy được");
    } finally {
      setRunning("");
    }
  };
  const onRun = (s, mode) => (mode === "reindex" ? setConfirm(s) : doRun(s, mode));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1100 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <FaceRetouchingNaturalIcon color="primary" />
          <Typography variant="h4">Dữ liệu tra cứu ảnh VĐV</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Nguồn dữ liệu cho tính năng &quot;Tra cứu ảnh VĐV&quot; (web + app). Kết quả tra cứu ghi rõ VĐV thuộc SportConnect, PickleballVN, PVNA hay tài khoản PickleTour (PickleTour quét cả ảnh đại diện lẫn ảnh CCCD).
        </Typography>
        {isLoading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" action={<Button onClick={refetch}>Thử lại</Button>}>
            {error?.data?.message || "Không tải được trạng thái"}
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            {sources.map((s) => (
              <SourceCard key={s.source} s={s} onRun={onRun} running={running} />
            ))}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800}>
                Quét bằng máy Windows
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Bộ quét (thư mục face-service/windows-worker) chạy trên máy ngoài: tự tải ảnh, tính mã khuôn mặt rồi gửi về — máy chủ
                không tốn CPU. Chạy &quot;quet-anh-moi.bat&quot; (ảnh mới/đổi) hoặc &quot;reindex-toan-bo.bat&quot;; chạy lại thì làm tiếp chỗ dừng.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={creatingKey ? <CircularProgress size={16} /> : <KeyIcon />}
                  disabled={creatingKey}
                  onClick={async () => {
                    try {
                      const r = await createKey().unwrap();
                      setNewKey(r.key);
                    } catch (e) {
                      toast.error(e?.data?.message || "Không tạo được mã");
                    }
                  }}
                >
                  {data?.workerKey ? "Tạo mã kết nối mới" : "Tạo mã kết nối"}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {data?.workerKey
                    ? `Mã hiện tại tạo lúc ${fmtDate(data.workerKey.createdAt)} — tạo mã mới thì mã cũ hết hiệu lực`
                    : "Chưa có mã kết nối"}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Box>
      <Dialog open={!!newKey} onClose={() => setNewKey("")} maxWidth="sm" fullWidth>
        <DialogTitle>Mã kết nối bộ quét</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Mã chỉ hiện một lần. Dán vào bộ quét khi được hỏi (hoặc sửa &quot;key&quot; trong config.json).
          </Typography>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover", fontFamily: "monospace", wordBreak: "break-all" }}>{newKey}</Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              navigator.clipboard?.writeText(newKey);
              toast.success("Đã chép mã");
            }}
          >
            Chép mã
          </Button>
          <Button onClick={() => setNewKey("")}>Đóng</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reindex toàn bộ avatar {confirm?.label}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Kéo dữ liệu mới rồi quét lại mã khuôn mặt cho {fmt(confirm?.withAvatar)} ảnh đại diện. Mất khoảng{" "}
            {Math.max(1, Math.round((confirm?.withAvatar || 0) / 3600))} giờ, chạy nền; trong lúc chạy vẫn tra cứu được bằng mã cũ.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Huỷ</Button>
          <Button
            color="warning"
            variant="contained"
            sx={{ color: "#fff !important" }}
            onClick={() => {
              const s = confirm;
              setConfirm(null);
              doRun(s, "reindex");
            }}
          >
            Reindex
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
