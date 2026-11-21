// layouts/pcoin/PcoinPage.jsx
// Tab PCoin trong Quản lý người dùng: tổng quan, số dư từng tài khoản, nạp / trừ, lịch sử giao dịch, giá tính năng.
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "dreamspos/ui";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";

import {
  useAdjustPcoinMutation,
  useGetPcoinSummaryQuery,
  useGetPcoinTransactionsQuery,
  useGetPcoinUsersQuery,
  useSetPcoinPricesMutation,
} from "slices/pcoinAdminApiSlice";

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => {
  if (!d) return "-";
  const x = new Date(d);
  return `${x.toLocaleDateString("vi-VN")} ${x.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

export const TX_TYPE = {
  topup: { label: "Nạp", color: "success" },
  deduct: { label: "Admin trừ", color: "warning" },
  spend: { label: "Sử dụng", color: "info" },
  refund: { label: "Hoàn", color: "secondary" },
};
const FEATURE = { highlightVar: "Highlight & VAR" };

function useDebounced(v, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

function UserCell({ u }) {
  if (!u) return <Typography variant="body2">-</Typography>;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar src={u.avatar || ""} sx={{ width: 32, height: 32 }}>
        {(u.name || u.nickname || "?").slice(0, 1)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {u.name || u.nickname || "(không tên)"}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {[u.nickname && `@${u.nickname}`, u.phone].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
    </Stack>
  );
}
UserCell.propTypes = { u: PropTypes.object };

/** Hộp thoại nạp / trừ PCoin — dùng chung ở trang PCoin và Quản lý người dùng. */
export function PcoinAdjustDialog({ user, initialMode, onClose }) {
  const [mode, setMode] = useState(initialMode || "topup");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [adjust, { isLoading }] = useAdjustPcoinMutation();
  useEffect(() => {
    setMode(initialMode || "topup");
    setAmount("");
    setNote("");
  }, [user?._id, initialMode]);
  if (!user) return null;
  const n = Math.trunc(Number(amount) || 0);
  const balance = Number(user.pcoin || 0);
  const after = mode === "topup" ? balance + n : balance - n;
  const invalid = n <= 0 || (mode === "deduct" && n > balance);
  const submit = async () => {
    try {
      const r = await adjust({ id: user._id, amount: mode === "topup" ? n : -n, note }).unwrap();
      toast.success(`${mode === "topup" ? "Đã nạp" : "Đã trừ"} ${fmt(n)} PCoin · số dư mới ${fmt(r.balance)}`);
      onClose(r.balance);
    } catch (e) {
      toast.error(e?.data?.message || e?.error || "Không thực hiện được");
    }
  };
  return (
    <Dialog open onClose={() => onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === "topup" ? "Nạp PCoin" : "Trừ PCoin"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <UserCell u={user} />
          <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, v) => v && setMode(v)} fullWidth>
            <ToggleButton value="topup">Nạp thêm</ToggleButton>
            <ToggleButton value="deduct">Trừ bớt</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="Số PCoin"
            type="number"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            inputProps={{ min: 1, step: 1 }}
            InputProps={{ endAdornment: <InputAdornment position="end">PCoin</InputAdornment> }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[5, 10, 20, 50, 100, 500].map((v) => (
              <Chip key={v} label={`${mode === "topup" ? "+" : "−"}${v}`} onClick={() => setAmount(String(v))} variant={n === v ? "filled" : "outlined"} color={n === v ? "primary" : "default"} />
            ))}
          </Stack>
          <TextField label="Ghi chú (vd: chuyển khoản 50.000đ ngày 18/11)" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} inputProps={{ maxLength: 300 }} />
          <Alert severity={mode === "deduct" && n > balance ? "error" : "info"} icon={false}>
            Số dư hiện tại <b>{fmt(balance)}</b> → sau khi {mode === "topup" ? "nạp" : "trừ"} <b>{fmt(Math.max(after, 0))}</b> PCoin
            {mode === "deduct" && n > balance ? " (không đủ để trừ)" : ""}
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>Đóng</Button>
        <Button variant="contained" color={mode === "topup" ? "success" : "warning"} disabled={invalid || isLoading} onClick={submit} sx={{ color: "#fff !important" }}>
          {isLoading ? <CircularProgress size={18} /> : mode === "topup" ? "Nạp PCoin" : "Trừ PCoin"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
PcoinAdjustDialog.propTypes = { user: PropTypes.object, initialMode: PropTypes.string, onClose: PropTypes.func.isRequired };

function StatCard({ label, value, sub, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: "1 1 180px", minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color, lineHeight: 1.2 }}>
        {value}
      </Typography>
      {sub ? (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      ) : null}
    </Paper>
  );
}
StatCard.propTypes = { label: PropTypes.node, value: PropTypes.node, sub: PropTypes.node, color: PropTypes.string };

function PriceCard({ summary }) {
  const [v, setV] = useState("");
  const [save, { isLoading }] = useSetPcoinPricesMutation();
  const cur = summary?.prices?.highlightVar;
  useEffect(() => {
    if (cur != null) setV(String(cur));
  }, [cur]);
  const changed = v !== "" && Number(v) !== cur;
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: "1 1 240px", minWidth: 220 }}>
      <Typography variant="caption" color="text.secondary">
        Giá tạo 1 video Highlight & VAR
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
        <TextField
          size="small"
          type="number"
          value={v}
          onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ""))}
          InputProps={{ endAdornment: <InputAdornment position="end">PCoin</InputAdornment> }}
          sx={{ width: 150 }}
        />
        <Button
          size="small"
          variant="contained"
          disabled={!changed || isLoading}
          sx={{ color: "#fff !important" }}
          onClick={async () => {
            try {
              await save({ highlightVar: Number(v) }).unwrap();
              toast.success("Đã lưu giá");
            } catch (e) {
              toast.error(e?.data?.message || "Không lưu được");
            }
          }}
        >
          Lưu
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        0 = miễn phí. Lỗi hoặc huỷ trước khi phân tích sẽ tự hoàn.
      </Typography>
    </Paper>
  );
}
PriceCard.propTypes = { summary: PropTypes.object };

function UsersTab({ onAdjust, onHistory }) {
  const [q, setQ] = useState("");
  const [onlyBalance, setOnlyBalance] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const dq = useDebounced(q);
  useEffect(() => setPage(0), [dq, onlyBalance]);
  const { data, isFetching, refetch } = useGetPcoinUsersQuery({ q: dq, onlyBalance: onlyBalance ? "1" : "", page: page + 1, pageSize });
  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Tìm tên, biệt danh, SĐT, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ flex: 1, maxWidth: 420 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <FormControlLabel control={<Switch checked={onlyBalance} onChange={(e) => setOnlyBalance(e.target.checked)} />} label="Chỉ tài khoản có số dư" />
        <Button startIcon={<RefreshIcon />} onClick={refetch} disabled={isFetching}>
          Tải lại
        </Button>
      </Stack>
      <Paper variant="outlined" sx={{ overflow: "auto" }}>
        <Table size="small">
          <TableHead sx={{ display: "table-header-group" }}>
            <TableRow>
              <TableCell>Tài khoản</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Số dư PCoin</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.users || []).map((u) => (
              <TableRow key={u._id} hover>
                <TableCell sx={{ maxWidth: 320 }}>
                  <UserCell u={u} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{u.email || "-"}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6" sx={{ color: u.pcoin > 0 ? "#f59e0b" : "text.secondary" }}>
                    {fmt(u.pcoin)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Button size="small" color="success" startIcon={<AddIcon />} onClick={() => onAdjust(u, "topup")}>
                    Nạp
                  </Button>
                  <Button size="small" color="warning" startIcon={<RemoveIcon />} disabled={!u.pcoin} onClick={() => onAdjust(u, "deduct")}>
                    Trừ
                  </Button>
                  <Button size="small" startIcon={<HistoryIcon />} onClick={() => onHistory(u)}>
                    Lịch sử
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isFetching && !(data?.users || []).length ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Không có tài khoản phù hợp
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        {isFetching && !data ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : null}
      </Paper>
      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(Number(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[20, 50, 100]}
        labelRowsPerPage="Mỗi trang"
      />
    </>
  );
}
UsersTab.propTypes = { onAdjust: PropTypes.func.isRequired, onHistory: PropTypes.func.isRequired };

function TransactionsTab({ user, onClearUser }) {
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => setPage(0), [type, user?._id]);
  const { data, isFetching, refetch } = useGetPcoinTransactionsQuery({ user: user?._id || "", type, page: page + 1, pageSize });
  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField select size="small" label="Loại" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">Tất cả</MenuItem>
          {Object.entries(TX_TYPE).map(([k, v]) => (
            <MenuItem key={k} value={k}>
              {v.label}
            </MenuItem>
          ))}
        </TextField>
        {user ? <Chip label={`Tài khoản: ${user.name || user.nickname || user.phone || user._id}`} onDelete={onClearUser} color="primary" variant="outlined" /> : null}
        <Button startIcon={<RefreshIcon />} onClick={refetch} disabled={isFetching}>
          Tải lại
        </Button>
      </Stack>
      <Paper variant="outlined" sx={{ overflow: "auto" }}>
        <Table size="small">
          <TableHead sx={{ display: "table-header-group" }}>
            <TableRow>
              <TableCell>Thời gian</TableCell>
              <TableCell>Tài khoản</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell align="right">PCoin</TableCell>
              <TableCell align="right">Số dư sau</TableCell>
              <TableCell>Nội dung</TableCell>
              <TableCell>Người thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.transactions || []).map((t) => (
              <TableRow key={t._id} hover>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(t.createdAt)}</TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <UserCell u={t.user} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={TX_TYPE[t.type]?.label || t.type} color={TX_TYPE[t.type]?.color || "default"} variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} sx={{ color: t.amount > 0 ? "success.main" : "error.main" }}>
                    {t.amount > 0 ? "+" : "−"}
                    {fmt(Math.abs(t.amount))}
                  </Typography>
                </TableCell>
                <TableCell align="right">{fmt(t.balanceAfter)}</TableCell>
                <TableCell sx={{ maxWidth: 320 }}>
                  <Typography variant="body2">{t.note || (t.feature ? FEATURE[t.feature] || t.feature : "-")}</Typography>
                  {t.feature && t.note ? (
                    <Typography variant="caption" color="text.secondary">
                      {FEATURE[t.feature] || t.feature}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>{t.by?.name || (t.type === "spend" || t.type === "refund" ? "Hệ thống" : "-")}</TableCell>
              </TableRow>
            ))}
            {!isFetching && !(data?.transactions || []).length ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Chưa có giao dịch
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(Number(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[20, 50, 100]}
        labelRowsPerPage="Mỗi trang"
      />
    </>
  );
}
TransactionsTab.propTypes = { user: PropTypes.object, onClearUser: PropTypes.func.isRequired };

/** Nội dung quản lý PCoin — nhúng làm tab "PCoin" trong Quản lý người dùng. */
export function PcoinPanel() {
  const [tab, setTab] = useState(0);
  const [adjust, setAdjust] = useState(null); // { user, mode }
  const [historyUser, setHistoryUser] = useState(null);
  const { data: summary } = useGetPcoinSummaryQuery();
  return (
    <>
      <Box sx={{ p: { xs: 1, md: 3 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Đồng xu trong app PickleTour. Dùng để tạo video Highlight & VAR. Admin nạp hoặc trừ cho từng tài khoản; mọi thay đổi đều ghi lịch sử.
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <StatCard label="Tổng số dư đang có" value={fmt(summary?.totalBalance)} sub={`${fmt(summary?.usersWithBalance)} tài khoản có số dư`} color="#f59e0b" />
          <StatCard label="Đã nạp" value={fmt(summary?.topup?.total)} sub={`${fmt(summary?.topup?.count)} lần nạp`} color="#16a34a" />
          <StatCard label="Đã dùng" value={fmt((summary?.spend?.total || 0) - (summary?.refund?.total || 0))} sub={`${fmt(summary?.spend?.count)} video · hoàn ${fmt(summary?.refund?.total)}`} color="#0ea5e9" />
          <StatCard label="Admin đã trừ" value={fmt(summary?.deduct?.total)} sub={`${fmt(summary?.deduct?.count)} lần`} />
          <PriceCard summary={summary} />
        </Stack>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Số dư tài khoản" />
          <Tab label="Lịch sử giao dịch" />
        </Tabs>
        {tab === 0 ? (
          <UsersTab
            onAdjust={(user, mode) => setAdjust({ user, mode })}
            onHistory={(u) => {
              setHistoryUser(u);
              setTab(1);
            }}
          />
        ) : (
          <TransactionsTab user={historyUser} onClearUser={() => setHistoryUser(null)} />
        )}
      </Box>
      {adjust ? <PcoinAdjustDialog user={adjust.user} initialMode={adjust.mode} onClose={() => setAdjust(null)} /> : null}
    </>
  );
}
