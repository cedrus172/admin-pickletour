// layouts/CamClipGrantsPage.jsx
// Admin: cấu hình + cấp quyền "Cắt Cam Sân" (PickClip) cho mọi venue có camera.
import React, { useEffect, useState } from "react";
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
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import {
  useAdminCamClipVenuesQuery,
  useCamClipGrantsQuery,
  useCamClipCamerasQuery,
  useCamClipPiQuery,
  useAddCamClipPiCameraMutation,
  useUpdateCamClipPiCameraMutation,
  useRemoveCamClipPiCameraMutation,
  useAddCamClipPiNvrMutation,
  useTestCamClipPiNvrMutation,
  useScanCamClipPiNvrMutation,
  useAddCamClipGrantMutation,
  useUpdateCamClipGrantMutation,
  useSetCamClipConfigMutation,
  useRemoveCamClipGrantMutation,
} from "slices/camClipApiSlice";

const DURATIONS = [
  { label: "1 tuần", days: 7 },
  { label: "1 tháng", days: 30 },
  { label: "1 năm", days: 365 },
  { label: "Vĩnh viễn", days: 0 },
];

function expiryLabel(expiresAt, expired) {
  if (expired) return "Hết hạn";
  if (!expiresAt) return "Vĩnh viễn";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Hết hạn";
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `Còn ${h} giờ`;
  return `Còn ${Math.floor(h / 24)} ngày`;
}

const STREAMS = [
  { label: "Luồng chính (nét)", value: 0 },
  { label: "Luồng phụ (nhẹ)", value: 1 },
];
const EMPTY_NVR = { name: "", host: "", user: "admin", password: "", vendor: "dahua", channels: 16, rtspPort: 554, webPort: 80 };

// Camera của sân: danh sách camera đang cho cắt clip (lưu trên Pi của sân) + thêm / sửa / xoá, thêm đầu ghi.
function CameraSection({ venueId, piAdminUrl }) {
  const { data, isFetching, error, refetch } = useCamClipPiQuery(venueId, { skip: !piAdminUrl });
  const [addCamera, { isLoading: adding }] = useAddCamClipPiCameraMutation();
  const [updateCamera, { isLoading: updating }] = useUpdateCamClipPiCameraMutation();
  const [removeCamera] = useRemoveCamClipPiCameraMutation();
  const [addNvr, { isLoading: addingNvr }] = useAddCamClipPiNvrMutation();
  const [testNvr, { isLoading: testing }] = useTestCamClipPiNvrMutation();
  const [scanNvr, { isLoading: scanning }] = useScanCamClipPiNvrMutation();

  const cameras = data?.cameras || [];
  const nvrs = data?.nvrs || [];

  const [editingId, setEditingId] = useState(null);
  const [nvrId, setNvrId] = useState("");
  const [channel, setChannel] = useState("");
  const [name, setName] = useState("");
  const [subtype, setSubtype] = useState(0);
  const [description, setDescription] = useState("");
  const [scanned, setScanned] = useState(null); // kênh quét được trên đầu ghi
  const [showNvrForm, setShowNvrForm] = useState(false);
  const [nvr, setNvr] = useState(EMPTY_NVR);

  // Chỉ có một đầu ghi thì chọn sẵn.
  useEffect(() => {
    if (!nvrId && nvrs.length === 1) setNvrId(nvrs[0].id);
  }, [nvrs, nvrId]);

  const resetForm = () => {
    setEditingId(null); setChannel(""); setName(""); setSubtype(0); setDescription("");
  };
  const startEdit = (c) => {
    setEditingId(c.id); setNvrId(c.nvrId); setChannel(String(c.channel)); setName(c.name);
    setSubtype(c.subtype); setDescription(c.description || "");
  };

  const onSubmit = async () => {
    if (!nvrId) return toast.warn("Chọn đầu ghi");
    if (!(Number(channel) >= 1)) return toast.warn("Nhập số kênh trên đầu ghi (từ 1)");
    if (!name.trim()) return toast.warn("Nhập tên camera, ví dụ: Sân 4");
    const body = { channel: Number(channel), name: name.trim(), subtype, description: description.trim() };
    try {
      if (editingId) {
        await updateCamera({ venueId, cameraId: editingId, ...body }).unwrap();
        toast.success("Đã lưu camera");
      } else {
        await addCamera({ venueId, nvrId: Number(nvrId), ...body }).unwrap();
        toast.success("Đã thêm camera");
      }
      resetForm();
    } catch (e) {
      toast.error(e?.data?.message || "Không lưu được camera");
    }
  };
  const onRemove = async (c) => {
    if (!window.confirm(`Gỡ camera "${c.name}" khỏi danh sách cắt clip? (Không ảnh hưởng đầu ghi.)`)) return;
    try {
      await removeCamera({ venueId, cameraId: c.id }).unwrap();
      if (editingId === c.id) resetForm();
      toast.success("Đã gỡ camera");
    } catch (e) {
      toast.error(e?.data?.message || "Không gỡ được camera");
    }
  };
  const onTest = async () => {
    if (!nvrId) return toast.warn("Chọn đầu ghi");
    try {
      const r = await testNvr({ venueId, nvrId, channel: Number(channel) || 1 }).unwrap();
      if (r.ok) toast.success(`Kết nối được${r.detail ? `: ${r.detail}` : ""}`);
      else toast.error(`Chưa kết nối được${r.detail ? `: ${r.detail}` : ""}`);
    } catch (e) {
      toast.error(e?.data?.message || "Không thử được kết nối");
    }
  };
  const onScan = async () => {
    if (!nvrId) return toast.warn("Chọn đầu ghi");
    try {
      const r = await scanNvr({ venueId, nvrId }).unwrap();
      setScanned(r.channels || []);
      if (!r.channels?.length) toast.info("Đầu ghi không trả về kênh nào");
    } catch (e) {
      setScanned(null);
      toast.error("Không quét được kênh trên đầu ghi. Hãy nhập số kênh thủ công.");
    }
  };
  const onAddNvr = async () => {
    if (!nvr.name.trim() || !nvr.host.trim() || !nvr.user.trim() || !nvr.password) {
      return toast.warn("Nhập tên, địa chỉ IP, tài khoản và mật khẩu đầu ghi");
    }
    try {
      const r = await addNvr({ venueId, ...nvr, name: nvr.name.trim(), host: nvr.host.trim(), user: nvr.user.trim() }).unwrap();
      setNvr(EMPTY_NVR); setShowNvrForm(false);
      if (r?.id) setNvrId(r.id);
      toast.success("Đã thêm đầu ghi");
    } catch (e) {
      toast.error(e?.data?.message || "Không thêm được đầu ghi");
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, ...(editingId ? { borderColor: "info.main" } : {}) }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" gutterBottom>Camera của sân ({cameras.length})</Typography>
        {piAdminUrl && <Button size="small" onClick={() => refetch()} disabled={isFetching}>Tải lại</Button>}
      </Stack>

      {!piAdminUrl ? (
        <Typography variant="body2" color="text.secondary">
          Nhập “Địa chỉ quản trị Pi (Tailscale)” ở mục Cấu hình rồi bấm Lưu cấu hình để thêm, sửa, xoá camera ngay tại đây.
        </Typography>
      ) : isFetching && !data ? (
        <Box sx={{ textAlign: "center", py: 2 }}><CircularProgress size={22} /></Box>
      ) : error ? (
        <Alert severity="error">{error?.data?.message || "Không tải được camera từ Pi của sân."}</Alert>
      ) : (
        <>
          {cameras.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sân này chưa có camera nào để cắt clip.</Typography>
          ) : (
            <Table size="small">
              <TableHead sx={{ display: "table-header-group" }}>
                <TableRow>
                  <TableCell>Tên camera</TableCell>
                  <TableCell>Đầu ghi</TableCell>
                  <TableCell>Kênh</TableCell>
                  <TableCell>Luồng</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {cameras.map((c) => (
                  <TableRow key={c.id} selected={editingId === c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.nvrName}</TableCell>
                    <TableCell>{c.channel}</TableCell>
                    <TableCell>{c.subtype === 1 ? "Phụ" : "Chính"}</TableCell>
                    <TableCell>{c.description}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Sửa">
                        <IconButton size="small" color="primary" onClick={() => startEdit(c)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Gỡ khỏi danh sách cắt clip">
                        <IconButton size="small" color="error" onClick={() => onRemove(c)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Thêm / sửa camera */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {editingId ? "Sửa camera" : "Thêm camera muốn cắt clip"}
            </Typography>
            {editingId && <Button size="small" onClick={resetForm}>Huỷ</Button>}
          </Stack>
          {nvrs.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pi của sân chưa có đầu ghi nào. Thêm đầu ghi bên dưới trước.
            </Typography>
          ) : (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                <TextField size="small" select label="Đầu ghi" value={nvrId} disabled={!!editingId}
                  onChange={(e) => { setNvrId(e.target.value); setScanned(null); }} sx={{ minWidth: 180 }}>
                  {nvrs.map((n) => (<MenuItem key={n.id} value={n.id}>{n.name} ({n.host})</MenuItem>))}
                </TextField>
                <TextField size="small" type="number" label="Kênh" value={channel}
                  onChange={(e) => setChannel(e.target.value)} sx={{ width: 100 }} inputProps={{ min: 1 }} />
                <TextField size="small" label="Tên camera" placeholder="Sân 4" value={name}
                  onChange={(e) => setName(e.target.value)} sx={{ flex: 1, minWidth: 140 }} />
                <TextField size="small" select label="Luồng" value={subtype}
                  onChange={(e) => setSubtype(Number(e.target.value))} sx={{ minWidth: 170 }}>
                  {STREAMS.map((o) => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1.5 }}>
                <TextField size="small" label="Mô tả (tuỳ chọn)" value={description}
                  onChange={(e) => setDescription(e.target.value)} sx={{ flex: 1 }} />
                <Button variant="outlined" onClick={onScan} disabled={scanning}>{scanning ? "Đang quét…" : "Quét kênh trên đầu ghi"}</Button>
                <Button variant="outlined" onClick={onTest} disabled={testing}>{testing ? "Đang thử…" : "Thử kết nối"}</Button>
                <Button variant="contained" sx={{ color: "#fff" }} onClick={onSubmit} disabled={adding || updating}>
                  {editingId ? "Lưu camera" : "Thêm camera"}
                </Button>
              </Stack>
              {scanned && scanned.length > 0 && (
                <Stack direction="row" sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
                  {scanned.map((c) => (
                    <Chip
                      key={c.channel}
                      size="small"
                      label={`Kênh ${c.channel}${c.title ? ` · ${c.title}` : ""}${c.added ? ` — đã thêm (${c.cameraName})` : ""}`}
                      color={String(c.channel) === String(channel) ? "info" : "default"}
                      variant={c.added ? "filled" : "outlined"}
                      disabled={c.added && !editingId}
                      onClick={() => { setChannel(String(c.channel)); if (!name.trim() && c.title) setName(c.title); }}
                    />
                  ))}
                </Stack>
              )}
            </>
          )}

          {/* Thêm đầu ghi */}
          <Box sx={{ mt: 2 }}>
            <Button size="small" onClick={() => setShowNvrForm((v) => !v)}>
              {showNvrForm ? "Ẩn phần thêm đầu ghi" : "Thêm đầu ghi (NVR) mới"}
            </Button>
            {showNvrForm && (
              <>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                  <TextField size="small" label="Tên đầu ghi" value={nvr.name} onChange={(e) => setNvr({ ...nvr, name: e.target.value })} sx={{ flex: 1 }} />
                  <TextField size="small" label="Địa chỉ IP (mạng nội bộ sân)" placeholder="192.168.1.200" value={nvr.host}
                    onChange={(e) => setNvr({ ...nvr, host: e.target.value })} sx={{ flex: 1 }} />
                  <TextField size="small" select label="Hãng" value={nvr.vendor} onChange={(e) => setNvr({ ...nvr, vendor: e.target.value })} sx={{ minWidth: 130 }}>
                    <MenuItem value="dahua">Dahua</MenuItem>
                    <MenuItem value="hikvision">Hikvision</MenuItem>
                  </TextField>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1.5 }}>
                  <TextField size="small" label="Tài khoản" value={nvr.user} onChange={(e) => setNvr({ ...nvr, user: e.target.value })} sx={{ flex: 1 }} />
                  <TextField size="small" type="password" label="Mật khẩu" autoComplete="new-password" value={nvr.password}
                    onChange={(e) => setNvr({ ...nvr, password: e.target.value })} sx={{ flex: 1 }} />
                  <TextField size="small" type="number" label="Số kênh" value={nvr.channels}
                    onChange={(e) => setNvr({ ...nvr, channels: Number(e.target.value) })} sx={{ width: 100 }} />
                  <TextField size="small" type="number" label="Cổng RTSP" value={nvr.rtspPort}
                    onChange={(e) => setNvr({ ...nvr, rtspPort: Number(e.target.value) })} sx={{ width: 110 }} />
                  <TextField size="small" type="number" label="Cổng web" value={nvr.webPort}
                    onChange={(e) => setNvr({ ...nvr, webPort: Number(e.target.value) })} sx={{ width: 100 }} />
                  <Button variant="contained" sx={{ color: "#fff" }} onClick={onAddNvr} disabled={addingNvr}>
                    {addingNvr ? "Đang thêm…" : "Thêm đầu ghi"}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}

CameraSection.propTypes = {
  venueId: PropTypes.string.isRequired,
  piAdminUrl: PropTypes.string,
};

function ManageDialog({ venue, onClose }) {
  const venueId = venue.venueId;
  const { data, isLoading } = useCamClipGrantsQuery(venueId);
  const { data: camData } = useCamClipCamerasQuery(venueId);
  const [setConfig, { isLoading: savingCfg }] = useSetCamClipConfigMutation();
  const [addGrant, { isLoading: adding }] = useAddCamClipGrantMutation();
  const [updateGrant, { isLoading: updating }] = useUpdateCamClipGrantMutation();
  const [removeGrant] = useRemoveCamClipGrantMutation();

  const cameras = camData?.cameras || [];
  const camName = (camId) => cameras.find((c) => c.id === camId)?.name || `Camera ${camId}`;

  const [enabled, setEnabled] = useState(false);
  const [piBaseUrl, setPiBaseUrl] = useState("");
  const [piAdminUrl, setPiAdminUrl] = useState("");
  useEffect(() => {
    if (data?.config) {
      setEnabled(!!data.config.enabled);
      setPiBaseUrl(data.config.piBaseUrl || "");
      setPiAdminUrl(data.config.piAdminUrl || "");
    }
  }, [data?.config]);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [phone, setPhone] = useState("");
  const [days, setDays] = useState(30); // -1 = giữ nguyên hạn (chỉ khi sửa)
  const [note, setNote] = useState("");
  const [camMode, setCamMode] = useState("all"); // "all" = tất cả camera; "pick" = chọn từng camera
  const [picked, setPicked] = useState([]); // channel id đã chọn
  const togglePick = (camId) =>
    setPicked((prev) => (prev.includes(camId) ? prev.filter((x) => x !== camId) : [...prev, camId]));

  const resetForm = () => {
    setEditingId(null); setEditingName(""); setPhone(""); setDays(30);
    setNote(""); setCamMode("all"); setPicked([]);
  };
  const startEdit = (g) => {
    setEditingId(g._id);
    setEditingName(g.user?.name || g.user?.nickname || g.user?.phone || "Người dùng");
    setPhone(g.user?.phone || "");
    setNote(g.note || "");
    const cams = Array.isArray(g.cameras) ? g.cameras : [];
    setCamMode(cams.length ? "pick" : "all");
    setPicked(cams);
    setDays(-1); // mặc định giữ nguyên hạn khi sửa
  };

  const onSaveConfig = async () => {
    try {
      await setConfig({ venueId, enabled, piBaseUrl: piBaseUrl.trim(), piAdminUrl: piAdminUrl.trim() }).unwrap();
      toast.success("Đã lưu cấu hình");
    } catch (e) {
      toast.error(e?.data?.message || "Không lưu được");
    }
  };
  const onSubmit = async () => {
    if (camMode === "pick" && picked.length === 0) return toast.warn("Chọn ít nhất một camera");
    const cameras = camMode === "pick" ? picked : [];
    try {
      if (editingId) {
        await updateGrant({
          id: editingId,
          venueId,
          cameras,
          note: note.trim(),
          ...(days >= 0 ? { durationDays: days } : {}), // -1 = giữ nguyên hạn
        }).unwrap();
        resetForm();
        toast.success("Đã lưu thay đổi");
      } else {
        if (!phone.trim()) return toast.warn("Nhập số điện thoại");
        await addGrant({ venueId, phone: phone.trim(), durationDays: days, note: note.trim(), cameras }).unwrap();
        resetForm();
        toast.success("Đã cấp quyền");
      }
    } catch (e) {
      toast.error(e?.data?.message || (editingId ? "Không lưu được" : "Không cấp được"));
    }
  };
  const onRemove = async (g) => {
    if (!window.confirm(`Thu hồi quyền của ${g.user?.name || g.user?.phone || "người này"}?`)) return;
    try { await removeGrant({ id: g._id, venueId }).unwrap(); }
    catch (e) { toast.error(e?.data?.message || "Không thu hồi được"); }
  };

  const grants = data?.grants || [];

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Quyền Cắt Cam Sân — {venue.venueName}</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={3}>
            {/* Cấu hình */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Cấu hình</Typography>
              <FormControlLabel
                control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                label="Bật Cắt Cam Sân cho venue này"
              />
              <TextField
                fullWidth size="small" sx={{ mt: 1 }}
                label="Pi base URL (camera venue)"
                placeholder="https://quangtrung.pickletour.vn"
                value={piBaseUrl}
                onChange={(e) => setPiBaseUrl(e.target.value)}
              />
              <TextField
                fullWidth size="small" sx={{ mt: 1.5 }}
                label="Địa chỉ quản trị Pi (Tailscale) — để thêm/sửa camera"
                placeholder="http://100.126.99.23:9997"
                helperText="Địa chỉ Tailscale của Pi tại sân, cổng 9997. Chỉ dùng nội bộ để quản lý camera bên dưới."
                value={piAdminUrl}
                onChange={(e) => setPiAdminUrl(e.target.value)}
              />
              <Button variant="contained" sx={{ mt: 2, color: "#fff" }} onClick={onSaveConfig} disabled={savingCfg}>
                {savingCfg ? "Đang lưu…" : "Lưu cấu hình"}
              </Button>
            </Paper>

            {/* Camera của sân (thêm / sửa / xoá camera muốn cắt clip) */}
            <CameraSection venueId={venueId} piAdminUrl={data?.config?.piAdminUrl || ""} />

            {/* Cấp quyền / Sửa quyền */}
            <Paper variant="outlined" sx={{ p: 2, ...(editingId ? { borderColor: "info.main" } : {}) }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" gutterBottom>
                  {editingId ? `Sửa quyền — ${editingName}` : "Cấp quyền cho người dùng"}
                </Typography>
                {editingId && <Button size="small" onClick={resetForm}>Huỷ</Button>}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField size="small" label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!!editingId} sx={{ minWidth: 160 }} />
                <TextField size="small" select label="Thời hạn" value={days} onChange={(e) => setDays(Number(e.target.value))} sx={{ minWidth: 150 }}>
                  {editingId && <MenuItem value={-1}>Giữ nguyên hạn</MenuItem>}
                  {DURATIONS.map((d) => (<MenuItem key={d.label} value={d.days}>{d.label}</MenuItem>))}
                </TextField>
                <TextField size="small" label="Ghi chú (tuỳ chọn)" value={note} onChange={(e) => setNote(e.target.value)} sx={{ flex: 1, minWidth: 160 }} />
                <Button variant="contained" sx={{ color: "#fff" }} onClick={onSubmit} disabled={adding || updating}>{editingId ? "Lưu thay đổi" : "Cấp quyền"}</Button>
              </Stack>

              {/* Phạm vi camera */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Phạm vi camera</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip
                    label="Tất cả camera"
                    color={camMode === "all" ? "info" : "default"}
                    variant={camMode === "all" ? "filled" : "outlined"}
                    onClick={() => setCamMode("all")}
                  />
                  <Chip
                    label="Chọn camera"
                    color={camMode === "pick" ? "info" : "default"}
                    variant={camMode === "pick" ? "filled" : "outlined"}
                    onClick={() => setCamMode("pick")}
                  />
                </Stack>
                {camMode === "pick" && (
                  cameras.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {camData?.error || "Chưa tải được camera của sân (kiểm tra Pi base URL và lưu cấu hình)."}
                    </Typography>
                  ) : (
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                      {cameras.map((c) => (
                        <Chip
                          key={c.id}
                          label={c.name}
                          color={picked.includes(c.id) ? "success" : "default"}
                          variant={picked.includes(c.id) ? "filled" : "outlined"}
                          onClick={() => togglePick(c.id)}
                        />
                      ))}
                    </Stack>
                  )
                )}
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                Khách đặt sân qua app tự được quyền cắt cam 48 giờ kể từ lúc nhận sân — không cần cấp thủ công.
              </Alert>
            </Paper>

            {/* Danh sách */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>Đã cấp quyền ({grants.length})</Typography>
              {grants.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Chưa cấp quyền cho ai.</Typography>
              ) : (
                <Table size="small">
                  <TableHead sx={{ display: "table-header-group" }}>
                    <TableRow>
                      <TableCell>Người dùng</TableCell>
                      <TableCell>SĐT</TableCell>
                      <TableCell>Camera</TableCell>
                      <TableCell>Ghi chú</TableCell>
                      <TableCell>Hạn</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grants.map((g) => (
                      <TableRow key={g._id}>
                        <TableCell>{g.user?.name || g.user?.nickname || "—"}</TableCell>
                        <TableCell>{g.user?.phone || ""}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          {g.cameras?.length ? (
                            <Chip size="small" variant="outlined" label={g.cameras.map(camName).join(", ")} />
                          ) : (
                            <Chip size="small" color="info" variant="outlined" label="Tất cả" />
                          )}
                        </TableCell>
                        <TableCell>{g.note || ""}</TableCell>
                        <TableCell>
                          <Chip size="small" color={g.expired ? "default" : "success"} label={expiryLabel(g.expiresAt, g.expired)} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Sửa">
                            <IconButton size="small" color="primary" onClick={() => startEdit(g)}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Thu hồi">
                            <IconButton size="small" color="error" onClick={() => onRemove(g)}><DeleteIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}

ManageDialog.propTypes = {
  venue: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function CamClipGrantsPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useAdminCamClipVenuesQuery(debounced);
  const venues = Array.isArray(data) ? data : [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ py: 3, px: { xs: 1, md: 2 } }}>
        <Typography variant="h5" gutterBottom>Quyền Cắt Cam Sân (PickClip)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bật tính năng cho từng sân (nhập Pi base URL), thêm camera muốn cắt và cấp quyền cắt cam cho người dùng — bấm Quản lý ở từng sân. Khách đặt sân tự có 48 giờ.
        </Typography>

        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <SearchIcon color="disabled" />
          <TextField
            fullWidth variant="standard"
            placeholder="Tìm sân theo tên… (để trống: sân đã bật)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{ disableUnderline: true }}
          />
          {isFetching && <CircularProgress size={18} />}
        </Paper>

        <Paper variant="outlined">
          <Table size="small">
            <TableHead sx={{ display: "table-header-group" }}>
              <TableRow>
                <TableCell>Sân</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Pi base URL</TableCell>
                <TableCell>Đã cấp</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {venues.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  {debounced ? "Không tìm thấy sân." : "Chưa có sân nào bật. Gõ tên sân để tìm và bật."}
                </TableCell></TableRow>
              ) : (
                venues.map((v) => (
                  <TableRow key={v.venueId} hover>
                    <TableCell>{v.venueName}</TableCell>
                    <TableCell>
                      <Chip size="small" color={v.enabled ? "success" : "default"} label={v.enabled ? "Đã bật" : "Chưa bật"} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.piBaseUrl || "—"}</TableCell>
                    <TableCell>{v.grantCount || 0}</TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<SettingsIcon />} onClick={() => setSelected(v)}>Quản lý</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {selected && <ManageDialog venue={selected} onClose={() => setSelected(null)} />}
    </DashboardLayout>
  );
}
