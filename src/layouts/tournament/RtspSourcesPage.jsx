// Nguồn video đã lưu (RTSP/HLS/RTMP) — quản trị thư viện nguồn dùng lại khi Auto-Live.
// Dùng API /tournament-auto-live/rtsp-sources (list/create/update/delete/test/bulk-credentials).
import { useMemo, useState } from "react";
import {
  Card,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  Checkbox,
  CircularProgress,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import VideocamIcon from "@mui/icons-material/Videocam";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/ErrorOutline";
import KeyIcon from "@mui/icons-material/VpnKey";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import {
  useListRtspSourcesQuery,
  useCreateRtspSourceMutation,
  useUpdateRtspSourceMutation,
  useDeleteRtspSourceMutation,
  useTestRtspSourcesMutation,
  useBulkUpdateRtspCredentialsMutation,
} from "slices/tournamentAutoLiveApiSlice";

const TRANSPORTS = [
  { value: "tcp", label: "TCP (mặc định)" },
  { value: "udp", label: "UDP" },
  { value: "udp_multicast", label: "UDP multicast" },
  { value: "http", label: "HTTP" },
];

const CORNERS = [
  { value: "top-left", label: "Trên · trái" },
  { value: "top-right", label: "Trên · phải" },
  { value: "bottom-left", label: "Dưới · trái" },
  { value: "bottom-right", label: "Dưới · phải" },
];

const cornerLabel = (v) => CORNERS.find((c) => c.value === v)?.label || v;

const EMPTY_FORM = {
  label: "",
  url: "",
  transport: "tcp",
  note: "",
  scoreboard: "top-left",
  brand: "top-right",
  sponsor: "bottom-right",
};

export default function RtspSourcesPage() {
  const { data: sources = [], isLoading, isFetching, refetch } = useListRtspSourcesQuery();
  const [createSource, { isLoading: creating }] = useCreateRtspSourceMutation();
  const [updateSource, { isLoading: updating }] = useUpdateRtspSourceMutation();
  const [deleteSource] = useDeleteRtspSourceMutation();
  const [testSources, { isLoading: testing }] = useTestRtspSourcesMutation();
  const [bulkCreds, { isLoading: bulkSaving }] = useBulkUpdateRtspCredentialsMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const [selected, setSelected] = useState([]); // ids đã tick
  const [results, setResults] = useState({}); // id -> { ok, info, error, ms }
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({ user: "", pass: "", ip: "", port: "" });
  const [bulkErr, setBulkErr] = useState("");

  const saving = creating || updating;
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBulkField = (k) => (e) => setBulk((b) => ({ ...b, [k]: e.target.value }));

  const rows = useMemo(
    () => [...sources].sort((a, b) => (a.label || "").localeCompare(b.label || "")),
    [sources],
  );

  const allIds = rows.map((r) => r._id);
  const allChecked = allIds.length > 0 && selected.length === allIds.length;
  const someChecked = selected.length > 0 && !allChecked;
  const selectedSet = new Set(selected);

  const toggleOne = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelected(allChecked ? [] : allIds);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErr("");
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditingId(s._id);
    setForm({
      label: s.label || "",
      url: s.url || "",
      transport: s.transport || "tcp",
      note: s.note || "",
      scoreboard: s.layout?.scoreboard || "top-left",
      brand: s.layout?.brand || "top-right",
      sponsor: s.layout?.sponsor || "bottom-right",
    });
    setErr("");
    setDialogOpen(true);
  };

  const onSave = async () => {
    setErr("");
    if (!form.label.trim()) return setErr("Chưa nhập tên gợi nhớ");
    if (!form.url.trim()) return setErr("Chưa nhập link nguồn (RTSP/HLS/RTMP)");
    const body = {
      label: form.label.trim(),
      url: form.url.trim(),
      transport: form.transport,
      note: form.note.trim(),
      layout: { scoreboard: form.scoreboard, brand: form.brand, sponsor: form.sponsor },
    };
    try {
      if (editingId) await updateSource({ id: editingId, ...body }).unwrap();
      else await createSource(body).unwrap();
      setDialogOpen(false);
      refetch();
    } catch (e) {
      setErr(e?.data?.message || e?.error || "Lưu thất bại");
    }
    return undefined;
  };

  const onDelete = async () => {
    if (!confirmDel) return;
    try {
      await deleteSource(confirmDel._id).unwrap();
      setConfirmDel(null);
      refetch();
    } catch (e) {
      setErr(e?.data?.message || "Xoá thất bại");
      setConfirmDel(null);
    }
  };

  const runTest = async (ids) => {
    const list = ids && ids.length ? ids : selected;
    if (!list.length) return;
    // Xoá kết quả cũ của các id sắp test để hiện spinner.
    setResults((r) => {
      const next = { ...r };
      list.forEach((id) => delete next[id]);
      return next;
    });
    try {
      const res = await testSources({ ids: list }).unwrap();
      const map = {};
      (res?.results || []).forEach((x) => {
        map[x.id] = x;
      });
      setResults((r) => ({ ...r, ...map }));
    } catch (e) {
      setErr(e?.data?.message || "Test thất bại");
    }
  };

  const applyBulk = async () => {
    setBulkErr("");
    if (!bulk.user.trim() && !bulk.pass && !bulk.ip.trim() && !bulk.port.trim()) {
      return setBulkErr("Nhập ít nhất 1 trong: user / pass / ip / port");
    }
    try {
      const res = await bulkCreds({
        ids: selected,
        user: bulk.user,
        pass: bulk.pass,
        ip: bulk.ip,
        port: bulk.port,
      }).unwrap();
      setBulkOpen(false);
      setBulk({ user: "", pass: "", ip: "", port: "" });
      refetch();
      // Test lại ngay các nguồn vừa đổi để xác nhận.
      runTest(selected);
      setErr(`Đã đổi thông tin ${res?.count ?? selected.length} nguồn.`);
    } catch (e) {
      setBulkErr(e?.data?.message || "Đổi thông tin thất bại");
    }
    return undefined;
  };

  const renderResult = (id) => {
    if (testing && selectedSet.has(id) && !results[id]) {
      return <CircularProgress size={16} color="info" />;
    }
    const r = results[id];
    if (!r) return <Typography variant="caption" sx={{ opacity: 0.5 }}>—</Typography>;
    if (r.ok) {
      const info = r.info || {};
      const dim = info.width && info.height ? `${info.width}×${info.height}` : "";
      const label = [info.codec, dim, info.fps ? `${info.fps}fps` : ""].filter(Boolean).join(" · ") || "OK";
      return (
        <Tooltip title={`Kết nối OK · ${r.ms}ms`}>
          <Chip
            size="small"
            color="success"
            icon={<CheckCircleIcon />}
            label={label}
            sx={{ maxWidth: 220 }}
          />
        </Tooltip>
      );
    }
    return (
      <Tooltip title={r.error || "Lỗi"}>
        <Chip size="small" color="error" icon={<ErrorIcon />} label="Không kết nối" />
      </Tooltip>
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Card sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.5}
            mb={2}
          >
            <Box>
              <MDTypography variant="h5" fontWeight="bold">
                Nguồn video đã lưu
              </MDTypography>
              <MDTypography variant="button" color="text">
                Thư viện link RTSP / HLS / RTMP có tên để chọn nhanh khi bắt đầu Auto-Live.
              </MDTypography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selected.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <NetworkCheckIcon />}
                    onClick={() => runTest(selected)}
                    disabled={testing}
                  >
                    Test kết nối ({selected.length})
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<KeyIcon />}
                    onClick={() => {
                      setBulkErr("");
                      setBulkOpen(true);
                    }}
                  >
                    Đổi user/pass/ip/port ({selected.length})
                  </Button>
                </>
              )}
              <Tooltip title="Tải lại">
                <span>
                  <IconButton onClick={refetch} disabled={isFetching}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Button variant="contained" color="info" startIcon={<AddIcon />} onClick={openAdd}>
                Thêm nguồn
              </Button>
            </Stack>
          </Stack>

          {isLoading ? (
            <MDBox display="flex" justifyContent="center" py={5}>
              <CircularProgress color="info" />
            </MDBox>
          ) : rows.length === 0 ? (
            <MDBox textAlign="center" py={6} sx={{ color: "rgba(255,255,255,0.7)" }}>
              <VideocamIcon sx={{ fontSize: 48, opacity: 0.5 }} />
              <MDTypography variant="body2" color="text" mt={1}>
                Chưa có nguồn video nào. Bấm “Thêm nguồn” để lưu link dùng lại.
              </MDTypography>
            </MDBox>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ display: "table-header-group" }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="info"
                        checked={allChecked}
                        indeterminate={someChecked}
                        onChange={toggleAll}
                      />
                    </TableCell>
                    <TableCell>Tên gợi nhớ</TableCell>
                    <TableCell>Link nguồn</TableCell>
                    <TableCell>Transport</TableCell>
                    <TableCell>Kết nối</TableCell>
                    <TableCell>Overlay</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s._id} hover selected={selectedSet.has(s._id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="info"
                          checked={selectedSet.has(s._id)}
                          onChange={() => toggleOne(s._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <MDTypography variant="button" fontWeight="medium">
                          {s.label}
                        </MDTypography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                            color: "rgba(255,255,255,0.75)",
                          }}
                        >
                          {s.url}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={s.transport} variant="outlined" color="info" />
                      </TableCell>
                      <TableCell>{renderResult(s._id)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                          {cornerLabel(s.layout?.scoreboard)} · {cornerLabel(s.layout?.brand)} ·{" "}
                          {cornerLabel(s.layout?.sponsor)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                          {s.note || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Test kết nối">
                          <IconButton size="small" color="info" onClick={() => runTest([s._id])}>
                            <NetworkCheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sửa">
                          <IconButton size="small" color="info" onClick={() => openEdit(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xoá">
                          <IconButton size="small" color="error" onClick={() => setConfirmDel(s)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {err ? (
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", mt: 1, display: "block" }}>
              {err}
            </Typography>
          ) : null}
        </Card>
      </MDBox>

      {/* Dialog thêm / sửa */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Sửa nguồn video" : "Thêm nguồn video"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={0.5}>
            <TextField
              label="Tên gợi nhớ"
              value={form.label}
              onChange={setField("label")}
              fullWidth
              placeholder="VD: Sân 1 — Camera trước"
            />
            <TextField
              label="Link nguồn (RTSP / HLS / RTMP)"
              value={form.url}
              onChange={setField("url")}
              fullWidth
              placeholder="rtsp://… hoặc https://…/index.m3u8"
            />
            <TextField select label="Transport" value={form.transport} onChange={setField("transport")} fullWidth>
              {TRANSPORTS.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField select label="Bảng điểm" value={form.scoreboard} onChange={setField("scoreboard")} fullWidth>
                {CORNERS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Logo PickleTour" value={form.brand} onChange={setField("brand")} fullWidth>
                {CORNERS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Tài trợ" value={form.sponsor} onChange={setField("sponsor")} fullWidth>
                {CORNERS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label="Ghi chú"
              value={form.note}
              onChange={setField("note")}
              fullWidth
              multiline
              minRows={2}
            />
            {err ? (
              <Typography variant="caption" color="error">
                {err}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Huỷ
          </Button>
          <Button onClick={onSave} variant="contained" color="info" disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Đổi user/pass/ip/port hàng loạt */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đổi user / pass / ip / port ({selected.length} nguồn)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: "rgba(255,255,255,0.75)" }}>
            Áp dụng cho {selected.length} nguồn đã chọn, chỉ đổi 4 thông tin dưới — giữ nguyên
            channel / path. Field để trống = giữ giá trị cũ của từng nguồn. Mật khẩu có ký tự đặc
            biệt (@, :, …) sẽ được tự mã hoá trong link RTSP.
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="User" value={bulk.user} onChange={setBulkField("user")} fullWidth placeholder="admin" />
              <TextField
                label="Password"
                value={bulk.pass}
                onChange={setBulkField("pass")}
                fullWidth
                placeholder="có @ cũng được"
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="IP / Host" value={bulk.ip} onChange={setBulkField("ip")} fullWidth placeholder="192.168.1.10" />
              <TextField label="Port" value={bulk.port} onChange={setBulkField("port")} fullWidth placeholder="554" />
            </Stack>
            {bulkErr ? (
              <Typography variant="caption" color="error">
                {bulkErr}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOpen(false)} color="secondary">
            Huỷ
          </Button>
          <Button onClick={applyBulk} variant="contained" color="warning" disabled={bulkSaving}>
            {bulkSaving ? "Đang đổi…" : "Đổi & kiểm tra lại"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Xác nhận xoá */}
      <Dialog open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Xoá nguồn video?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Xoá “{confirmDel?.label}”? Thao tác không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDel(null)} color="secondary">
            Huỷ
          </Button>
          <Button onClick={onDelete} variant="contained" color="error">
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
