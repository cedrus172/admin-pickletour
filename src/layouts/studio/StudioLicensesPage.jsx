// layouts/studio/StudioLicensesPage.jsx — "Bản quyền Studio": cấp quyền dùng app Pickletour Studio
// (desktop + iPhone/iPad) cho từng tài khoản, và chia sẻ quyền live trên page Facebook giữa các tài khoản.
import React from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "dreamspos/ui";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import {
  useAddStudioPageShareMutation,
  useDeleteStudioLicenseMutation,
  useGetStudioLicensesQuery,
  useGetStudioPagesQuery,
  useGetStudioRtspSourcesQuery,
  useLazySearchStudioUsersQuery,
  useRemoveStudioPageShareMutation,
  useUpdateStudioSettingsMutation,
  useUpsertStudioLicenseMutation,
} from "slices/studioAdminApiSlice";

const errText = (e, fallback) => e?.data?.message || e?.error || fallback;
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "");
const dateInputValue = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
};
const userLabel = (u) => u?.nickname || u?.name || "(không tên)";
const userContact = (u) => [u?.phone, u?.email].filter(Boolean).join(" · ");
const PLATFORM = { darwin: "Mac", win32: "Windows", linux: "Linux", ios: "iPhone/iPad" };

function UserCell({ user }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        src={user?.avatar || undefined}
        alt={userLabel(user)}
        sx={{ width: 36, height: 36 }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {userLabel(user)}
          {user?.name && user?.nickname && user.name !== user.nickname ? (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
              {user.name}
            </Typography>
          ) : null}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
          {userContact(user) || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}
UserCell.propTypes = { user: PropTypes.object };

/** Ô tìm tài khoản (tên, nickname, SĐT, email) — chọn một tài khoản thì gọi onPick. */
function UserSearch({ label, actionLabel, onPick, disabledIds, busy }) {
  const [keyword, setKeyword] = React.useState("");
  const [search, { data, isFetching }] = useLazySearchStudioUsersQuery();
  React.useEffect(() => {
    const k = keyword.trim();
    if (k.length < 2) return undefined;
    const t = setTimeout(() => search(k), 300);
    return () => clearTimeout(t);
  }, [keyword, search]);
  const items = keyword.trim().length >= 2 ? data?.items || [] : [];
  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        label={label}
        placeholder="Nhập tên, nickname, số điện thoại hoặc email (ít nhất 2 ký tự)"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      {keyword.trim().length >= 2 ? (
        <Paper
          variant="outlined"
          sx={{ mt: 1, borderRadius: 2, maxHeight: 280, overflowY: "auto" }}
        >
          {isFetching && !items.length ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <CircularProgress size={20} />
            </Box>
          ) : null}
          {!isFetching && !items.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              Không tìm thấy tài khoản nào.
            </Typography>
          ) : null}
          {items.map((u) => {
            const taken = disabledIds?.includes(u._id);
            return (
              <Stack
                key={u._id}
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.5, py: 1, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <UserCell user={u} />
                <Button
                  size="small"
                  variant={taken ? "outlined" : "contained"}
                  disabled={taken || busy}
                  onClick={() => onPick(u)}
                  sx={{ flex: "none" }}
                >
                  {taken ? "Đã có" : actionLabel}
                </Button>
              </Stack>
            );
          })}
        </Paper>
      ) : null}
    </Box>
  );
}
UserSearch.propTypes = {
  label: PropTypes.string.isRequired,
  actionLabel: PropTypes.string.isRequired,
  onPick: PropTypes.func.isRequired,
  disabledIds: PropTypes.arrayOf(PropTypes.string),
  busy: PropTypes.bool,
};

/** Chọn các camera máy chủ một tài khoản được dùng (không chọn gì = mọi camera đang bật). */
function RtspSourcesDialog({ row, onClose, onSave }) {
  const { data, isLoading } = useGetStudioRtspSourcesQuery();
  const [picked, setPicked] = React.useState(() => new Set(row.rtspSources || []));
  const [keyword, setKeyword] = React.useState("");
  const sources = data?.items || [];
  const needle = keyword.trim().toLowerCase();
  const shown = needle
    ? sources.filter((s) => `${s.label} ${s.host}`.toLowerCase().includes(needle))
    : sources;
  const toggle = (id) =>
    setPicked((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Camera máy chủ cho {userLabel(row.user)}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Không tích camera nào = được dùng mọi camera đang bật. Tích chọn để giới hạn đúng các
          camera đó.
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="Lọc camera"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{ mb: 1 }}
        />
        {isLoading ? <CircularProgress size={22} /> : null}
        <Stack sx={{ maxHeight: 360, overflowY: "auto" }}>
          {shown.map((s) => (
            <FormControlLabel
              key={s.id}
              control={<Checkbox checked={picked.has(s.id)} onChange={() => toggle(s.id)} />}
              label={
                <span>
                  {s.label}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {s.host}
                    {s.tailnet ? " · mạng Tailscale" : ""}
                    {s.disabled ? " · đang tắt" : ""}
                  </Typography>
                </span>
              }
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPicked(new Set())}>Bỏ chọn hết (mọi camera)</Button>
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="contained" onClick={() => onSave([...picked])}>
          Lưu {picked.size ? `(${picked.size} camera)` : "(mọi camera)"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
RtspSourcesDialog.propTypes = {
  row: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

function LicenseRow({ row, onSources, onRevoke }) {
  const [upsert, { isLoading }] = useUpsertStudioLicenseMutation();
  const [note, setNote] = React.useState(row.note || "");
  React.useEffect(() => setNote(row.note || ""), [row.note]);
  const save = async (body) => {
    try {
      await upsert({ userId: row.user._id, ...body }).unwrap();
    } catch (e) {
      toast.error(errText(e, "Không lưu được"));
    }
  };
  const flag = (key) => (
    <Switch
      checked={!!row[key]}
      disabled={isLoading}
      onChange={(e) => save({ [key]: e.target.checked })}
    />
  );
  const seen = row.lastSeenAt
    ? `Mở app lần cuối ${fmtDateTime(row.lastSeenAt)} · ${
        PLATFORM[row.lastPlatform] || row.lastPlatform || "?"
      } ${row.lastVersion || ""}`
    : "Chưa mở app lần nào";
  return (
    <TableRow hover>
      <TableCell sx={{ minWidth: 200, maxWidth: 300 }}>
        <UserCell user={row.user} />
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5, pl: 5.75 }}>
          {!row.active ? (
            <Chip
              size="small"
              color={row.reason === "expired" ? "warning" : "default"}
              label={row.reason === "expired" ? "Đã hết hạn" : "Đang khoá"}
            />
          ) : null}
          <Typography variant="caption" color="text.secondary">
            {seen}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">{flag("enabled")}</TableCell>
      <TableCell align="center">{flag("noWatermark")}</TableCell>
      <TableCell align="center">{flag("var")}</TableCell>
      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
        {flag("rtsp")}
        <Button size="small" disabled={!row.rtsp} onClick={() => onSources(row)} sx={{ ml: 0.5 }}>
          {row.rtspSources?.length ? `${row.rtspSources.length} camera` : "Mọi camera"}
        </Button>
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          type="date"
          value={dateInputValue(row.expiresAt)}
          onChange={(e) =>
            save({ expiresAt: e.target.value ? `${e.target.value}T23:59:59` : null })
          }
          sx={{ width: 138 }}
        />
      </TableCell>
      <TableCell sx={{ width: 130 }}>
        <TextField
          size="small"
          placeholder="Ghi chú"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== (row.note || "") && save({ note })}
        />
      </TableCell>
      <TableCell align="right">
        <IconButton
          size="small"
          color="error"
          title="Thu hồi bản quyền"
          onClick={() => onRevoke(row)}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
LicenseRow.propTypes = {
  row: PropTypes.object.isRequired,
  onSources: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
};

function LicensesTab() {
  const { data, isLoading, isError, refetch } = useGetStudioLicensesQuery();
  const [upsert, { isLoading: granting }] = useUpsertStudioLicenseMutation();
  const [remove, { isLoading: revoking }] = useDeleteStudioLicenseMutation();
  const [updateSettings, { isLoading: savingSettings }] = useUpdateStudioSettingsMutation();
  const [sourcesRow, setSourcesRow] = React.useState(null);
  const [revokeRow, setRevokeRow] = React.useState(null);
  const items = data?.items || [];

  const grant = async (user) => {
    try {
      await upsert({ userId: user._id, enabled: true }).unwrap();
      toast.success(`Đã cấp quyền dùng Studio cho ${userLabel(user)}`);
    } catch (e) {
      toast.error(errText(e, "Không cấp được quyền"));
    }
  };
  const saveSources = async (ids) => {
    try {
      await upsert({ userId: sourcesRow.user._id, rtspSources: ids }).unwrap();
      setSourcesRow(null);
    } catch (e) {
      toast.error(errText(e, "Không lưu được"));
    }
  };
  const revoke = async () => {
    try {
      await remove(revokeRow.user._id).unwrap();
      toast.success("Đã thu hồi bản quyền");
      setRevokeRow(null);
    } catch (e) {
      toast.error(errText(e, "Không thu hồi được"));
    }
  };
  const setEnforce = async (enforce) => {
    try {
      await updateSettings({ enforce }).unwrap();
    } catch (e) {
      toast.error(errText(e, "Không lưu được"));
    }
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <UserSearch
          label="Cấp quyền cho tài khoản"
          actionLabel="Cấp quyền dùng Studio"
          onPick={grant}
          busy={granting}
          disabledIds={items.map((r) => r.user._id)}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Tài khoản quản trị luôn có đủ quyền, không cần cấp. Tài khoản khác phải có ở danh sách
          dưới mới mở được Pickletour Studio (bản từ 0.12).
        </Typography>
      </Paper>

      {data && !data.networkConfigured ? (
        <Alert severity="warning">
          Máy chủ chưa cấu hình Tailscale nên quyền “Camera máy chủ” chỉ dùng được trên máy đã cài
          Tailscale.
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : null}
        {isError ? (
          <Alert severity="error" action={<Button onClick={refetch}>Thử lại</Button>}>
            Không tải được danh sách bản quyền.
          </Alert>
        ) : null}
        {!isLoading && !isError && !items.length ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            Chưa cấp bản quyền cho tài khoản nào. Tìm tài khoản ở ô phía trên để cấp.
          </Typography>
        ) : null}
        {items.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tài khoản</TableCell>
                  <TableCell align="center">Dùng app</TableCell>
                  <TableCell align="center">Bỏ logo</TableCell>
                  <TableCell align="center">VAR</TableCell>
                  <TableCell align="center">Camera máy chủ</TableCell>
                  <TableCell>Hết hạn</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <LicenseRow
                    key={row.user._id}
                    row={row}
                    onSources={setSourcesRow}
                    onRevoke={setRevokeRow}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={!!data?.enforce}
              disabled={savingSettings || !data}
              onChange={(e) => setEnforce(e.target.checked)}
            />
          }
          label="Chặn cả ở máy chủ (áp dụng cho mọi bản Studio, kể cả bản cũ)"
        />
        <Typography variant="body2" color="text.secondary">
          Bản Studio từ 0.12 tự khoá khi tài khoản chưa có bản quyền. Các bản cũ hơn không có màn
          khoá; bật công tắc này thì máy chủ từ chối tạo live Facebook qua PickleTour và Soi VAR từ
          Studio với tài khoản chưa được cấp — nên bật sau khi đội live đã cập nhật bản mới và được
          cấp quyền.
        </Typography>
      </Paper>

      {sourcesRow ? (
        <RtspSourcesDialog
          row={sourcesRow}
          onClose={() => setSourcesRow(null)}
          onSave={saveSources}
        />
      ) : null}
      <Dialog open={!!revokeRow} onClose={() => setRevokeRow(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Thu hồi bản quyền?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {revokeRow ? userLabel(revokeRow.user) : ""} sẽ không mở được Pickletour Studio nữa (có
            hiệu lực trong vòng 10 phút; buổi live đang chạy không bị cắt). Muốn tạm khoá mà giữ
            nguyên các lựa chọn, hãy tắt công tắc “Dùng app”.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeRow(null)}>Huỷ</Button>
          <Button color="error" variant="contained" disabled={revoking} onClick={revoke}>
            Thu hồi
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function PageCard({ page, onShare }) {
  const [remove, { isLoading }] = useRemoveStudioPageShareMutation();
  const expired = page.expireAt && new Date(page.expireAt).getTime() < Date.now();
  const unshare = async (user) => {
    try {
      await remove({ connectionId: page.id, userId: user._id }).unwrap();
      toast.success(`Đã thu quyền của ${userLabel(user)} trên ${page.pageName}`);
    } catch (e) {
      toast.error(errText(e, "Không thu được quyền"));
    }
  };
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ md: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar
            src={page.pagePicture || undefined}
            alt={page.pageName}
            sx={{ width: 44, height: 44 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} noWrap>
              {page.pageName}
              {expired ? (
                <Chip size="small" color="warning" label="Quyền Facebook hết hạn" sx={{ ml: 1 }} />
              ) : null}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              Kết nối bởi {userLabel(page.owner)}
              {userContact(page.owner) ? ` · ${userContact(page.owner)}` : ""}
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PersonAddAlt1Icon />}
          onClick={() => onShare(page)}
          sx={{ flex: "none" }}
        >
          Chia sẻ cho tài khoản khác
        </Button>
      </Stack>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ mt: 1.25 }}
        flexWrap="wrap"
        useFlexGap
        alignItems="center"
      >
        <Typography variant="caption" color="text.secondary">
          Được live trên page này:
        </Typography>
        {page.shares.length ? (
          page.shares.map((s) => (
            <Chip
              key={s.user._id}
              size="small"
              color="info"
              label={`${userLabel(s.user)}${s.user.phone ? ` · ${s.user.phone}` : ""}`}
              disabled={isLoading}
              onDelete={() => unshare(s.user)}
            />
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">
            chỉ chủ kết nối
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
PageCard.propTypes = { page: PropTypes.object.isRequired, onShare: PropTypes.func.isRequired };

function PagesTab() {
  const [keyword, setKeyword] = React.useState("");
  const [applied, setApplied] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setApplied(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);
  const { data, isLoading, isFetching, isError, refetch } = useGetStudioPagesQuery(applied);
  const [addShare, { isLoading: adding }] = useAddStudioPageShareMutation();
  const [sharePageId, setSharePageId] = React.useState(null);
  const items = data?.items || [];
  const sharePage = items.find((p) => p.id === sharePageId) || null;

  const share = async (user) => {
    try {
      await addShare({ connectionId: sharePage.id, userId: user._id }).unwrap();
      toast.success(`${userLabel(user)} đã được live trên ${sharePage.pageName}`);
    } catch (e) {
      toast.error(errText(e, "Không chia sẻ được"));
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Tài khoản A kết nối page (ở mục Kết nối Facebook hoặc trong Studio). Chia sẻ cho tài khoản B
        thì B thấy page đó trong Pickletour Studio và tự tạo được luồng live trên page — không cần
        đăng nhập Facebook của A. B không gỡ được kết nối và không thấy khoá của page.
      </Alert>
      <TextField
        size="small"
        label="Tìm page hoặc chủ kết nối"
        placeholder="Tên page, tên/SĐT/email người kết nối"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        sx={{ maxWidth: 480 }}
      />
      {isLoading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress size={26} />
        </Box>
      ) : null}
      {isError ? (
        <Alert severity="error" action={<Button onClick={refetch}>Thử lại</Button>}>
          Không tải được danh sách page.
        </Alert>
      ) : null}
      {!isLoading && !isError && !items.length ? (
        <Typography color="text.secondary">
          {applied ? "Không có page nào khớp." : "Chưa có tài khoản nào kết nối page Facebook."}
        </Typography>
      ) : null}
      <Stack spacing={1.25} sx={{ opacity: isFetching ? 0.6 : 1 }}>
        {items.map((p) => (
          <PageCard key={p.id} page={p} onShare={(page) => setSharePageId(page.id)} />
        ))}
      </Stack>

      <Dialog open={!!sharePage} onClose={() => setSharePageId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Chia sẻ page {sharePage?.pageName}</DialogTitle>
        <DialogContent sx={{ minHeight: 320 }}>
          {sharePage ? (
            <UserSearch
              label="Tài khoản được live trên page này"
              actionLabel="Chia sẻ"
              onPick={share}
              busy={adding}
              disabledIds={[
                sharePage.owner?._id,
                ...sharePage.shares.map((s) => s.user._id),
              ].filter(Boolean)}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setSharePageId(null)}>
            Xong
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default function StudioLicensesPage() {
  const [tab, setTab] = React.useState(0);
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
        <Typography variant="h5" fontWeight={800}>
          Bản quyền Studio
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cấp quyền dùng app Pickletour Studio (Mac, Windows, iPhone/iPad) cho từng tài khoản
          PickleTour và chia sẻ quyền live trên page Facebook.
        </Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Tài khoản được cấp" />
          <Tab label="Chia sẻ page Facebook" />
        </Tabs>
        {tab === 0 ? <LicensesTab /> : <PagesTab />}
      </Box>
    </DashboardLayout>
  );
}
