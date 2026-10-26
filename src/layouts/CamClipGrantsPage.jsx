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
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import {
  useAdminCamClipVenuesQuery,
  useCamClipGrantsQuery,
  useAddCamClipGrantMutation,
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

function ManageDialog({ venue, onClose }) {
  const venueId = venue.venueId;
  const { data, isLoading } = useCamClipGrantsQuery(venueId);
  const [setConfig, { isLoading: savingCfg }] = useSetCamClipConfigMutation();
  const [addGrant, { isLoading: adding }] = useAddCamClipGrantMutation();
  const [removeGrant] = useRemoveCamClipGrantMutation();

  const [enabled, setEnabled] = useState(false);
  const [piBaseUrl, setPiBaseUrl] = useState("");
  useEffect(() => {
    if (data?.config) {
      setEnabled(!!data.config.enabled);
      setPiBaseUrl(data.config.piBaseUrl || "");
    }
  }, [data?.config]);

  const [phone, setPhone] = useState("");
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");

  const onSaveConfig = async () => {
    try {
      await setConfig({ venueId, enabled, piBaseUrl: piBaseUrl.trim() }).unwrap();
      toast.success("Đã lưu cấu hình");
    } catch (e) {
      toast.error(e?.data?.message || "Không lưu được");
    }
  };
  const onAdd = async () => {
    if (!phone.trim()) return toast.warn("Nhập số điện thoại");
    try {
      await addGrant({ venueId, phone: phone.trim(), durationDays: days, note: note.trim() }).unwrap();
      setPhone(""); setNote("");
      toast.success("Đã cấp quyền");
    } catch (e) {
      toast.error(e?.data?.message || "Không cấp được");
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
              <Button variant="contained" sx={{ mt: 2, color: "#fff" }} onClick={onSaveConfig} disabled={savingCfg}>
                {savingCfg ? "Đang lưu…" : "Lưu cấu hình"}
              </Button>
            </Paper>

            {/* Cấp quyền */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Cấp quyền cho người dùng</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField size="small" label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ minWidth: 160 }} />
                <TextField size="small" select label="Thời hạn" value={days} onChange={(e) => setDays(Number(e.target.value))} sx={{ minWidth: 140 }}>
                  {DURATIONS.map((d) => (<MenuItem key={d.label} value={d.days}>{d.label}</MenuItem>))}
                </TextField>
                <TextField size="small" label="Ghi chú (tuỳ chọn)" value={note} onChange={(e) => setNote(e.target.value)} sx={{ flex: 1, minWidth: 160 }} />
                <Button variant="contained" sx={{ color: "#fff" }} onClick={onAdd} disabled={adding}>Cấp quyền</Button>
              </Stack>
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
                        <TableCell>{g.note || ""}</TableCell>
                        <TableCell>
                          <Chip size="small" color={g.expired ? "default" : "success"} label={expiryLabel(g.expiresAt, g.expired)} />
                        </TableCell>
                        <TableCell align="right">
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
          Bật tính năng cho từng sân (nhập Pi base URL) và cấp quyền cắt cam cho người dùng. Khách đặt sân tự có 48 giờ.
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
