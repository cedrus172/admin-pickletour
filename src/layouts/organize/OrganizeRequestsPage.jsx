// layouts/organize/OrganizeRequestsPage.jsx — "Yêu cầu tổ chức giải": người dùng gửi từ nút "Tổ chức giải" (web + app).
// Admin gọi lại, cập nhật trạng thái (người gửi nhận thông báo) và ghi chú.
import React from "react";
import PropTypes from "prop-types";
import { Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from "dreamspos/ui";
import PhoneIcon from "@mui/icons-material/Phone";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useGetOrganizeRequestsQuery, useUpdateOrganizeRequestMutation } from "slices/organizeAdminApiSlice";

const STATUS = {
  new: { label: "Chờ liên hệ", color: "warning" },
  contacted: { label: "Đã liên hệ", color: "info" },
  organizing: { label: "Đang tổ chức", color: "primary" },
  done: { label: "Hoàn tất", color: "success" },
  cancelled: { label: "Đã huỷ", color: "default" },
};
const fmt = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "");

function RequestCard({ r }) {
  const [update, { isLoading }] = useUpdateOrganizeRequestMutation();
  const [note, setNote] = React.useState(r.adminNote || "");
  React.useEffect(() => setNote(r.adminNote || ""), [r.adminNote]);
  const save = async (body, ok) => {
    try {
      await update({ id: r._id, ...body }).unwrap();
      if (ok) toast.success(ok);
    } catch (e) {
      toast.error(e?.data?.message || "Không cập nhật được");
    }
  };
  const st = STATUS[r.status] || STATUS.new;
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderLeft: "5px solid", borderLeftColor: r.status === "new" ? "warning.main" : "divider" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography fontWeight={900}>{r.code}</Typography>
          <Chip size="small" color={st.color} label={st.label} />
          <Typography variant="caption" color="text.secondary">
            {fmt(r.createdAt)}
          </Typography>
        </Stack>
        <Button size="small" variant="contained" startIcon={<PhoneIcon />} href={`tel:${r.phone}`} sx={{ color: "#fff !important" }}>
          {r.contactName ? `${r.contactName} · ` : ""}
          {r.phone}
        </Button>
      </Stack>
      <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>
        {r.name}
      </Typography>
      <Typography variant="body2">📍 {r.location}</Typography>
      {r.timeText ? <Typography variant="body2">🗓 {r.timeText}</Typography> : null}
      <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
        {(r.events || []).map((e) => (
          <Chip key={e} size="small" variant="outlined" label={e} />
        ))}
        {r.teams ? <Chip size="small" label={`${r.teams} đội dự kiến`} /> : null}
      </Stack>
      {r.note ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
          Ghi chú: {r.note}
        </Typography>
      ) : null}
      {r.user?.name ? (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
          Tài khoản gửi: {r.user.name}
          {r.user.nickname ? ` (${r.user.nickname})` : ""}
          {r.user.phone ? ` · ${r.user.phone}` : ""}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
        {Object.entries(STATUS)
          .filter(([k]) => k !== r.status)
          .map(([k, v]) => (
            <Button key={k} size="small" variant="outlined" disabled={isLoading} onClick={() => save({ status: k }, `Đã chuyển sang "${v.label}" và báo người gửi`)}>
              {v.label}
            </Button>
          ))}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
        <TextField size="small" fullWidth label="Ghi chú nội bộ (chỉ admin thấy)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button variant="outlined" disabled={isLoading} onClick={() => save({ adminNote: note }, "Đã lưu ghi chú")}>
          Lưu
        </Button>
      </Stack>
    </Paper>
  );
}
RequestCard.propTypes = { r: PropTypes.object.isRequired };

export default function OrganizeRequestsPage() {
  const [status, setStatus] = React.useState("");
  const [q, setQ] = React.useState("");
  const { data, isLoading } = useGetOrganizeRequestsQuery({ status, q }, { pollingInterval: 60000 });
  const counts = data?.counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1100 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <EmojiEventsIcon color="warning" />
          <Typography variant="h4">Yêu cầu tổ chức giải</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Người dùng gửi từ nút &quot;Tổ chức giải&quot; ở trang Giải đấu (web + app). Gọi lại theo SĐT, rồi cập nhật trạng thái — người gửi nhận
          thông báo.
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ md: "center" }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Tất cả (${total})`} color={!status ? "primary" : "default"} onClick={() => setStatus("")} />
            {Object.entries(STATUS).map(([k, v]) => (
              <Chip key={k} label={`${v.label} (${counts[k] || 0})`} color={status === k ? "primary" : "default"} onClick={() => setStatus(k)} />
            ))}
          </Stack>
          <TextField size="small" label="Tìm mã, tên giải, SĐT…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 240 }} />
        </Stack>
        {isLoading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (data?.requests || []).length ? (
          <Stack spacing={1.5}>
            {data.requests.map((r) => (
              <RequestCard key={r._id} r={r} />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Chưa có yêu cầu nào.
          </Typography>
        )}
      </Box>
    </DashboardLayout>
  );
}
