// Nguồn video đã lưu (RTSP/HLS/RTMP) — quản trị thư viện nguồn dùng lại khi Auto-Live.
// Dùng API /tournament-auto-live/rtsp-sources (list/create/update/delete).
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
  CircularProgress,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import VideocamIcon from "@mui/icons-material/Videocam";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import {
  useListRtspSourcesQuery,
  useCreateRtspSourceMutation,
  useUpdateRtspSourceMutation,
  useDeleteRtspSourceMutation,
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(null); // source cần xoá

  const saving = creating || updating;
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const rows = useMemo(
    () => [...sources].sort((a, b) => (a.label || "").localeCompare(b.label || "")),
    [sources],
  );

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
            <Stack direction="row" spacing={1}>
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
            <MDBox
              textAlign="center"
              py={6}
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
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
                    <TableCell>Tên gợi nhớ</TableCell>
                    <TableCell>Link nguồn</TableCell>
                    <TableCell>Transport</TableCell>
                    <TableCell>Overlay (bảng điểm · logo · tài trợ)</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s._id} hover>
                      <TableCell>
                        <MDTypography variant="button" fontWeight="medium">
                          {s.label}
                        </MDTypography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>
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
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                          {cornerLabel(s.layout?.scoreboard)} · {cornerLabel(s.layout?.brand)} ·{" "}
                          {cornerLabel(s.layout?.sponsor)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                          {s.note || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
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
