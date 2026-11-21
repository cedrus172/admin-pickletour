// src/layouts/youtube/YouTubeLiveAdmin.jsx
import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  LinearProgress,
  CircularProgress,
} from "dreamspos/ui";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyIcon from "@mui/icons-material/VpnKey";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/ErrorOutline";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { useGetConfigQuery, useYtRevokeMutation } from "slices/configApiSlice";
import { useLazyYtInitQuery, useLazyYtGetStreamKeyQuery } from "slices/youtubeAdminApiSlice";

import PropTypes from "prop-types";
import FbLongUserTokenPage from "./FbLongUserTokenPage";
import FbPageInfoBulk from "./FbPageInfoBulk";

function CopyField({ label, value }) {
  const [snack, setSnack] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value || "");
      setSnack(true);
    } catch {}
  };
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField fullWidth size="small" value={value || ""} InputProps={{ readOnly: true }} />
        <Tooltip title="Copy">
          <span>
            <IconButton onClick={copy} disabled={!value}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Snackbar open={snack} autoHideDuration={1800} onClose={() => setSnack(false)}>
        <Alert onClose={() => setSnack(false)} severity="success" variant="filled">
          Copied!
        </Alert>
      </Snackbar>
    </Box>
  );
}
CopyField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

export default function YouTubeLiveAdmin() {
  // === Đọc & giữ refetch của từng config key (QUAN TRỌNG)
  const { data: chTitle, refetch: refetchChTitle } = useGetConfigQuery("YOUTUBE_CHANNEL_TITLE");
  const { data: chId, refetch: refetchChId } = useGetConfigQuery("YOUTUBE_CHANNEL_ID");
  const { data: token, refetch: refetchToken } = useGetConfigQuery("YOUTUBE_REFRESH_TOKEN");
  const { data: streamId, refetch: refetchStreamId } = useGetConfigQuery(
    "YOUTUBE_REUSABLE_STREAM_ID"
  );

  const [getInit, { isFetching: initLoading }] = useLazyYtInitQuery();
  const [getKey, { isFetching: keyLoading }] = useLazyYtGetStreamKeyQuery();
  const [revoke, { isLoading: revokeLoading }] = useYtRevokeMutation();

  const [authUrl, setAuthUrl] = React.useState("");
  const [err, setErr] = React.useState("");
  const [keyData, setKeyData] = React.useState(null);
  const [snack, setSnack] = React.useState({ open: false, message: "", severity: "success" });
  const [syncing, setSyncing] = React.useState(false);

  const connected = Boolean(token?.value);

  // Gộp refetch cho tiện
  const refreshStatus = React.useCallback(async () => {
    try {
      setSyncing(true);
      await Promise.all([refetchToken(), refetchChId(), refetchChTitle(), refetchStreamId()]);
    } catch (e) {
      setErr(e?.data?.message || e?.error || e?.message || "Refresh failed");
    } finally {
      setSyncing(false);
    }
  }, [refetchToken, refetchChId, refetchChTitle, refetchStreamId]);

  // Nhận postMessage từ popup callback → auto refresh
  React.useEffect(() => {
    const onMsg = (ev) => {
      try {
        if (ev.origin !== window.location.origin) return;
        if (ev?.data?.type === "yt-auth-done" && ev?.data?.ok) {
          refreshStatus();
          setAuthUrl("");
          setErr("");
        }
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [refreshStatus]);

  // Khi tab được focus/visible → refresh (đề phòng postMessage/poll miss)
  React.useEffect(() => {
    const onFocus = () => refreshStatus();
    const onVis = () => !document.hidden && refreshStatus();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshStatus]);

  // Mở OAuth popup + short-poll nhẹ để bắt trạng thái nếu postMessage không tới
  const openAuth = async () => {
    try {
      const r = await getInit().unwrap();
      setAuthUrl(r?.authUrl || "");
      let popup = null;
      if (r?.authUrl) {
        popup = window.open(
          r.authUrl,
          "ytAuth",
          "width=520,height=700,menubar=no,toolbar=no,location=no,status=no"
        );
      }
      // Poll tối đa 30s mỗi 1.5s: check refresh token có thay đổi chưa
      let t = 0;
      const iv = setInterval(async () => {
        try {
          // popup đóng → dừng & refresh
          if (popup && popup.closed) {
            clearInterval(iv);
            await refreshStatus();
            return;
          }
          await refetchToken();
          if (Boolean((await refetchToken()).data?.value)) {
            clearInterval(iv);
            await refreshStatus();
          }
        } catch {}
        t += 1500;
        if (t >= 30000) clearInterval(iv);
      }, 1500);
    } catch (e) {
      setErr(e?.data?.message || e?.error || e?.message || "Init failed");
    }
  };

  const fetchStreamKey = async () => {
    setKeyData(null);
    try {
      const r = await getKey().unwrap();
      setKeyData(r);
      await refetchStreamId();
      setSnack({ open: true, message: "Đã lấy stream key YouTube.", severity: "success" });
    } catch (e) {
      setErr(e?.data?.message || e?.error || e?.message || "Get stream key failed");
    }
  };

  const disconnect = async () => {
    try {
      if (!connected) return;
      const ok = window.confirm("Bạn có chắc muốn ngắt kết nối YouTube? (Refresh token sẽ bị xoá)");
      if (!ok) return;
      await revoke().unwrap();
      setKeyData(null);
      await refreshStatus(); // 🔥 cập nhật ngay UI sau revoke
      setSnack({ open: true, message: "Đã ngắt kết nối YouTube.", severity: "success" });
    } catch (e) {
      setErr(e?.data?.message || e?.error || e?.message || "Revoke failed");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Stack spacing={2}>
        <Typography variant="h5">YouTube Live – Thiết lập & Stream Key</Typography>

        {/* THẺ TRẠNG THÁI */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography sx={{ mr: 1, fontWeight: 600 }}>Trạng thái:</Typography>
            <Chip
              icon={connected ? <CheckCircleIcon /> : <ErrorIcon />}
              label={connected ? "ĐÃ KẾT NỐI (có refresh token)" : "CHƯA KẾT NỐI"}
              color={connected ? "success" : "warning"}
              variant={connected ? "filled" : "outlined"}
            />
            {chTitle?.value && <Chip label={`Kênh: ${chTitle.value}`} variant="outlined" />}
            {streamId?.value && <Chip label={`Stream ID: ${streamId.value}`} variant="outlined" />}
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Refetch trạng thái từ Config">
              <span>
                <Button
                  startIcon={<RefreshIcon />}
                  size="small"
                  onClick={refreshStatus}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} />
                      <span>Resync…</span>
                    </Stack>
                  ) : (
                    "Resync"
                  )}
                </Button>
              </span>
            </Tooltip>
            {connected && (
              <Tooltip title="Ngắt kết nối YouTube (revoke refresh token)">
                <span>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={disconnect}
                    disabled={revokeLoading}
                  >
                    {revokeLoading ? "Đang ngắt…" : "Ngắt kết nối"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>

          {(initLoading || revokeLoading || syncing) && <LinearProgress sx={{ mt: 1 }} />}

          <Divider sx={{ my: 2 }} />

          {/* KẾT NỐI GOOGLE */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 220, fontWeight: 600 }}>
              1) Kết nối tài khoản YouTube
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={openAuth}
                startIcon={<OpenInNewIcon />}
                disabled={initLoading}
              >
                Mở Google Login
              </Button>
              <Button onClick={refreshStatus} startIcon={<RefreshIcon />}>
                Tôi đã đăng nhập xong
              </Button>
            </Stack>
          </Stack>

          {authUrl && (
            <Typography variant="caption" sx={{ mt: 1, display: "block", opacity: 0.7 }}>
              Nếu popup bị chặn, bạn có thể mở link thủ công: {authUrl}
            </Typography>
          )}
        </Paper>

        {/* LẤY STREAM KEY */}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 220, fontWeight: 600 }}>
              2) Tạo / Lấy RTMPS + Stream Key
            </Typography>
            <Button
              variant="contained"
              startIcon={<KeyIcon />}
              onClick={fetchStreamKey}
              disabled={!connected || keyLoading}
            >
              {keyLoading ? "Đang lấy…" : "Lấy Stream Key"}
            </Button>
            {!connected && (
              <Typography variant="body2" color="error">
                Cần kết nối YouTube trước (bước 1).
              </Typography>
            )}
          </Stack>

          {keyLoading && <LinearProgress sx={{ mt: 1 }} />}

          {keyData && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <CopyField label="RTMPS Server (khuyên dùng)" value={keyData.server_url_secure} />
              <CopyField label="Stream Key" value={keyData.stream_key} />
              <CopyField label="(Tuỳ chọn) RTMP Server" value={keyData.server_url} />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Gợi ý: Dán <b>RTMPS Server</b> + <b>Stream Key</b> vào encoder/OBS. Đây là “reusable
                stream key”, bạn có thể dùng nhiều lần.
              </Typography>
            </Stack>
          )}
        </Paper>

        {/* SNACKBAR LỖI */}
        <Snackbar open={!!err} autoHideDuration={4000} onClose={() => setErr("")}>
          <Alert severity="error" variant="filled" onClose={() => setErr("")}>
            {err}
          </Alert>
        </Snackbar>
        {/* SNACKBAR THÀNH CÔNG */}
        <Snackbar
          open={snack.open}
          autoHideDuration={3500}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity}
            variant="filled"
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Stack>
      <FbLongUserTokenPage />
      <FbPageInfoBulk />
    </DashboardLayout>
  );
}
