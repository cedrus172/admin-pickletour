/* eslint-disable react/prop-types */
// layouts/FanpageReviewPage.jsx — Duyệt Fanpage (yêu cầu tạo trang của CLB / BTC / sân / thương hiệu)
import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "dreamspos/ui";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAdminListFanpagesQuery, useAdminReviewFanpageMutation } from "slices/fanpageAdminApiSlice";

const STATUS_TABS = [
  ["pending", "Chờ duyệt"],
  ["approved", "Đã duyệt"],
  ["rejected", "Từ chối"],
  ["suspended", "Tạm khoá"],
];

const KIND_LABEL = {
  club: "Câu lạc bộ",
  organizer: "Ban tổ chức",
  venue: "Sân",
  brand: "Thương hiệu",
  community: "Cộng đồng",
  official: "Chính thức",
};

const STATUS_CHIP = {
  pending: { label: "Chờ duyệt", color: "warning" },
  approved: { label: "Đã duyệt", color: "success" },
  rejected: { label: "Từ chối", color: "error" },
  suspended: { label: "Tạm khoá", color: "default" },
};

const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN") : "");
const userName = (u) => u?.nickname || u?.name || "—";
const errMsg = (e) => e?.data?.message || e?.error || "Có lỗi xảy ra";

function FanpageCard({ p, onAction, busy }) {
  const st = STATUS_CHIP[p.status] || STATUS_CHIP.pending;
  return (
    <Card sx={{ p: 0, overflow: "hidden" }}>
      {p.cover ? (
        <Box
          component="a"
          href={p.cover}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: "block", height: 110, backgroundImage: `url("${p.cover}")`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      ) : (
        <Box sx={{ height: 44, background: "linear-gradient(90deg, rgba(255,159,67,.18), rgba(255,159,67,.04))" }} />
      )}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar src={p.avatar || undefined} alt={p.name} sx={{ width: 64, height: 64, mt: p.cover ? -5 : 0, border: "3px solid #fff" }}>
            {(p.name || "?").slice(0, 1)}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h6" fontWeight={800} sx={{ mr: 0.5 }}>
                {p.name}
              </Typography>
              {p.verified && <Chip size="small" color="info" label="✔ Dấu tích xanh" />}
              <Chip size="small" color={st.color} label={st.label} />
              <Chip size="small" variant="outlined" label={KIND_LABEL[p.kind] || p.kind} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              @{p.slug}
              {p.province ? ` · ${p.province}` : ""}
              {` · tạo ${fmtTime(p.createdAt)}`}
              {p.reviewedAt ? ` · xử lý ${fmtTime(p.reviewedAt)}` : ""}
            </Typography>
            {p.description ? (
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                {p.description}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                (Chưa có mô tả)
              </Typography>
            )}
            <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              <Typography variant="body2">
                Người tạo: <b>{userName(p.createdBy)}</b>
              </Typography>
              {p.phone ? <Typography variant="body2">SĐT: {p.phone}</Typography> : null}
              {p.website ? (
                <Typography variant="body2">
                  Website:{" "}
                  <a href={p.website} target="_blank" rel="noopener noreferrer">
                    {p.website}
                  </a>
                </Typography>
              ) : null}
              <Typography variant="body2">
                {p.followerCount || 0} người theo dõi · {p.postCount || 0} bài
              </Typography>
            </Stack>
            {p.verifyDocs?.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                <Typography variant="body2">Giấy tờ xác minh:</Typography>
                {p.verifyDocs.map((u, i) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                    Tệp {i + 1}
                  </a>
                ))}
              </Stack>
            )}
            {p.reviewNote ? (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Ghi chú duyệt: {p.reviewNote}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
          {p.status !== "approved" && (
            <Button size="small" variant="contained" color="success" disabled={busy} onClick={() => onAction(p, "approve")}>
              {p.status === "suspended" ? "Mở lại" : "Duyệt"}
            </Button>
          )}
          {p.status === "pending" && (
            <Button size="small" variant="outlined" color="error" disabled={busy} onClick={() => onAction(p, "reject")}>
              Từ chối
            </Button>
          )}
          {p.status === "approved" && !p.isOfficial && (
            <Button size="small" variant="outlined" color="warning" disabled={busy} onClick={() => onAction(p, "suspend")}>
              Tạm khoá
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Switch checked={Boolean(p.verified)} disabled={busy || p.isOfficial} onChange={() => onAction(p, "verify")} />
            <Typography variant="body2">Dấu tích xanh</Typography>
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}

export default function FanpageReviewPage() {
  const [status, setStatus] = useState("pending");
  const { data, isFetching, refetch } = useAdminListFanpagesQuery({ status });
  const [review, { isLoading: busy }] = useAdminReviewFanpageMutation();
  const [rejecting, setRejecting] = useState(null); // { page, mode: "reject" | "suspend" }
  const [note, setNote] = useState("");

  const items = data?.items || [];
  const counts = data?.counts || {};

  const run = async (body, okMsg) => {
    try {
      await review(body).unwrap();
      toast.success(okMsg);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const onAction = (p, action) => {
    if (action === "approve") return run({ id: p._id, status: "approved" }, `Đã duyệt Fanpage ${p.name}`);
    if (action === "verify") return run({ id: p._id, verified: !p.verified }, p.verified ? "Đã bỏ dấu tích xanh" : "Đã gắn dấu tích xanh");
    setNote("");
    setRejecting({ page: p, mode: action });
    return null;
  };

  const confirmReject = async () => {
    const text = note.trim();
    if (!text) {
      toast.error("Nhập lý do để chủ trang biết cần sửa gì");
      return;
    }
    const { page, mode } = rejecting;
    await run(
      { id: page._id, status: mode === "suspend" ? "suspended" : "rejected", note: text },
      mode === "suspend" ? `Đã tạm khoá ${page.name}` : `Đã từ chối ${page.name}`
    );
    setRejecting(null);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 2 }} spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            Duyệt Fanpage
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" onClick={() => refetch()}>
            Làm mới
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          CLB, ban tổ chức, sân, thương hiệu gửi yêu cầu tạo Fanpage từ app. Trang chỉ hiện và được đăng bài / story sau khi được duyệt.
        </Typography>
        <Tabs value={status} onChange={(e, v) => setStatus(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
          {STATUS_TABS.map(([key, label]) => (
            <Tab key={key} value={key} label={`${label} (${counts[key] || 0})`} />
          ))}
        </Tabs>
        {isFetching && !data && <CircularProgress />}
        {!isFetching && items.length === 0 && <Typography color="text.secondary">Không có Fanpage nào.</Typography>}
        <Stack spacing={2}>
          {items.map((p) => (
            <FanpageCard key={p._id} p={p} onAction={onAction} busy={busy} />
          ))}
        </Stack>
      </Box>

      <Dialog open={Boolean(rejecting)} onClose={() => setRejecting(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {rejecting?.mode === "suspend" ? "Tạm khoá" : "Từ chối"} Fanpage {rejecting?.page?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Lý do (gửi cho chủ trang)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Ảnh đại diện chưa rõ, vui lòng bổ sung giấy tờ xác minh CLB…"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(null)}>Huỷ</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={confirmReject}>
            {rejecting?.mode === "suspend" ? "Tạm khoá" : "Từ chối"}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
