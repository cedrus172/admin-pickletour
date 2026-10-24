import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ReplayIcon from "@mui/icons-material/Replay";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import {
  useFbytPagesQuery,
  useFbytLivesQuery,
  useFbytJobsQuery,
  useFbytUploadMutation,
  useFbytRetryMutation,
  useFbytUpdateMetaMutation,
} from "slices/fbYoutubeApiSlice";

const fmtDur = (s) => {
  const n = Math.max(0, Math.round(Number(s) || 0));
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const ss = n % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`;
};
const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

const STATUS = {
  pending: { label: "Chờ xử lý", color: "default" },
  downloading: { label: "Đang tải FB", color: "info" },
  uploading: { label: "Đang up YouTube", color: "warning" },
  done: { label: "Xong", color: "success" },
  failed: { label: "Lỗi", color: "error" },
  canceled: { label: "Huỷ", color: "default" },
};

export default function FbToYoutubePage() {
  const { data: pages = [], isFetching: pagesLoading } = useFbytPagesQuery();
  const [pageId, setPageId] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [selected, setSelected] = useState({});
  // Sửa tiêu đề/mô tả YouTube trước khi up: { [fbVideoId]: { title, description } }
  const [edits, setEdits] = useState({});
  const setEdit = (id, patch) =>
    setEdits((e) => ({ ...e, [id]: { ...(e[id] || {}), ...patch } }));

  useEffect(() => {
    if (!pageId && pages.length) setPageId(pages[0].pageId);
  }, [pages, pageId]);

  const {
    data: livesData,
    isFetching: livesLoading,
    refetch: refetchLives,
    error: livesError,
  } = useFbytLivesQuery({ pageId }, { skip: !pageId });
  const lives = livesData?.items || [];

  // Poll nhật ký khi có job đang chạy.
  const { data: jobs = [], refetch: refetchJobs } = useFbytJobsQuery(
    { pageId },
    { skip: !pageId, pollingInterval: 5000 },
  );
  const hasRunning = jobs.some((j) =>
    ["pending", "downloading", "uploading"].includes(j.status),
  );
  useEffect(() => {
    if (!hasRunning) return;
    const t = setInterval(() => refetchLives(), 7000);
    return () => clearInterval(t);
  }, [hasRunning, refetchLives]);

  const [doUpload, { isLoading: uploading }] = useFbytUploadMutation();
  const [doRetry] = useFbytRetryMutation();
  const [doUpdateMeta, { isLoading: savingMeta }] = useFbytUpdateMetaMutation();
  // Sửa tiêu đề/mô tả clip ĐÃ up: id job đang sửa + giá trị.
  const [editJob, setEditJob] = useState("");
  const [editVals, setEditVals] = useState({ title: "", description: "" });
  const saveMeta = async (id) => {
    try {
      await doUpdateMeta({ id, title: editVals.title, description: editVals.description }).unwrap();
      toast.success("Đã cập nhật tiêu đề/mô tả trên YouTube");
      setEditJob("");
      refetchJobs();
    } catch (e) {
      toast.error(e?.data?.message || e?.error || "Cập nhật thất bại");
    }
  };

  const selectableLives = useMemo(
    () => lives.filter((v) => !v.upload || ["failed", "canceled"].includes(v.upload.status)),
    [lives],
  );
  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const allSelected =
    selectableLives.length > 0 && selectableLives.every((v) => selected[v.fbVideoId]);

  const toggleAll = (on) => {
    const next = {};
    if (on) selectableLives.forEach((v) => (next[v.fbVideoId] = true));
    setSelected(next);
  };

  const handleUpload = async () => {
    const videos = lives
      .filter((v) => selected[v.fbVideoId])
      .map((v) => {
        const ed = edits[v.fbVideoId] || {};
        const title = (ed.title ?? v.title ?? "").trim();
        return {
          fbVideoId: v.fbVideoId,
          // Tiêu đề/mô tả đã sửa (nếu để trống title → fallback tên FB ở backend).
          title: title || v.title || "",
          description: ed.description ?? v.description ?? "",
          permalink: v.permalink,
          createdTime: v.createdTime,
          durationSec: v.durationSec,
          thumbnail: v.thumbnail,
        };
      });
    if (!videos.length) return toast.info("Chưa chọn video nào");
    try {
      const r = await doUpload({ pageId, videos, privacy }).unwrap();
      toast.success(`Đã xếp hàng ${r.created?.length || videos.length} video lên YouTube`);
      setSelected({});
      refetchJobs();
    } catch (e) {
      toast.error(e?.data?.message || e?.error || "Lỗi xếp hàng upload");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box py={3} px={{ xs: 1, md: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Tải VOD Facebook → Upload YouTube
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Chọn fanpage → tích các <b>VOD của buổi live đã kết thúc</b> → <b>Up lên YouTube</b>. Hệ
          thống tự tải về và upload (chế độ theo lựa chọn bên dưới). Mỗi video chỉ up một lần
          (chống trùng). Lưu ý giới hạn quota upload YouTube (~6 video/ngày với quota mặc định).
        </Alert>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
          <TextField
            select
            label="Fanpage nguồn"
            size="small"
            sx={{ minWidth: 260 }}
            value={pageId}
            onChange={(e) => {
              setPageId(e.target.value);
              setSelected({});
            }}
            disabled={pagesLoading}
          >
            {pages.map((p) => (
              <MenuItem key={p.pageId} value={p.pageId}>
                {p.pageName}
                {p.needsReauth ? " ⚠️" : ""}
              </MenuItem>
            ))}
            {!pages.length && <MenuItem value="">(chưa có fanpage trong pool)</MenuItem>}
          </TextField>
          <TextField
            select
            label="Chế độ video YouTube"
            size="small"
            sx={{ minWidth: 180 }}
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
          >
            <MenuItem value="public">Công khai (Public)</MenuItem>
            <MenuItem value="unlisted">Không liệt kê (Unlisted)</MenuItem>
            <MenuItem value="private">Riêng tư (Private)</MenuItem>
          </TextField>
          <Button startIcon={<RefreshIcon />} onClick={() => refetchLives()} disabled={livesLoading}>
            Tải lại danh sách
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
            disabled={uploading || !selectedIds.length}
            onClick={handleUpload}
          >
            Up {selectedIds.length || ""} video lên YouTube
          </Button>
        </Stack>

        {livesError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {livesError?.data?.message || "Không tải được danh sách VOD. Kiểm tra token fanpage."}
          </Alert>
        ) : null}

        <Card variant="outlined" sx={{ p: 1.5, mb: 3 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={!allSelected && selectedIds.length > 0}
                  onChange={(e) => toggleAll(e.target.checked)}
                  disabled={!selectableLives.length}
                />
              }
              label={`VOD live đã kết thúc (${lives.length})`}
            />
            {livesLoading ? <CircularProgress size={16} sx={{ ml: 1 }} /> : null}
          </Stack>
          <Divider />
          {!lives.length && !livesLoading ? (
            <Typography sx={{ p: 2, color: "text.secondary" }}>
              Fanpage này chưa có buổi live nào đã kết thúc.
            </Typography>
          ) : null}
          <Stack divider={<Divider />}>
            {lives.map((v) => {
              const up = v.upload;
              const disabled = up && !["failed", "canceled"].includes(up.status);
              const isSel = !!selected[v.fbVideoId];
              const ed = edits[v.fbVideoId] || {};
              return (
                <Box key={v.fbVideoId} sx={{ py: 0.5 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ py: 0.5 }}
                >
                  <Checkbox
                    size="small"
                    checked={!!selected[v.fbVideoId]}
                    disabled={disabled}
                    onChange={(e) =>
                      setSelected((s) => ({ ...s, [v.fbVideoId]: e.target.checked }))
                    }
                  />
                  {v.thumbnail ? (
                    <Box
                      component="img"
                      src={v.thumbnail}
                      alt=""
                      sx={{ width: 96, height: 54, objectFit: "cover", borderRadius: 1, flexShrink: 0 }}
                    />
                  ) : (
                    <Box sx={{ width: 96, height: 54, bgcolor: "action.hover", borderRadius: 1 }} />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {v.title || "(không tiêu đề)"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fmtDate(v.createdTime)} · {fmtDur(v.durationSec)}
                      {v.permalink ? (
                        <>
                          {" · "}
                          <Link href={v.permalink} target="_blank" rel="noopener">
                            Xem FB <OpenInNewIcon sx={{ fontSize: 12, verticalAlign: "middle" }} />
                          </Link>
                        </>
                      ) : null}
                    </Typography>
                  </Box>
                  {up ? (
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Chip
                        size="small"
                        label={STATUS[up.status]?.label || up.status}
                        color={STATUS[up.status]?.color || "default"}
                      />
                      {up.ytUrl ? (
                        <Link href={up.ytUrl} target="_blank" rel="noopener" variant="caption">
                          Xem YouTube ↗
                        </Link>
                      ) : null}
                    </Stack>
                  ) : (
                    <Chip size="small" variant="outlined" label="Chưa up" />
                  )}
                </Stack>
                {isSel && !disabled ? (
                  <Stack spacing={1} sx={{ pl: 6, pr: 1, pb: 1.5 }}>
                    <TextField
                      label="Tiêu đề YouTube"
                      size="small"
                      fullWidth
                      value={ed.title ?? v.title ?? ""}
                      onChange={(e) => setEdit(v.fbVideoId, { title: e.target.value })}
                      inputProps={{ maxLength: 100 }}
                      helperText={`${(ed.title ?? v.title ?? "").length}/100 ký tự`}
                    />
                    <TextField
                      label="Mô tả YouTube"
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                      maxRows={6}
                      value={ed.description ?? v.description ?? ""}
                      onChange={(e) => setEdit(v.fbVideoId, { description: e.target.value })}
                      placeholder="Để trống = tự ghi link nguồn Facebook"
                    />
                  </Stack>
                ) : null}
                </Box>
              );
            })}
          </Stack>
        </Card>

        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          Nhật ký upload
        </Typography>
        <Card variant="outlined" sx={{ p: 1.5 }}>
          {!jobs.length ? (
            <Typography sx={{ color: "text.secondary" }}>Chưa có job nào.</Typography>
          ) : (
            <Stack divider={<Divider />}>
              {jobs.map((j) => (
                <Box key={j._id} sx={{ py: 0.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {j.ytTitle || j.fbTitle || j.fbVideoId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fmtDate(j.updatedAt)}
                      {j.error ? ` · ${j.error}` : ""}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`${STATUS[j.status]?.label || j.status}${
                      ["downloading", "uploading"].includes(j.status) ? ` ${j.progress || 0}%` : ""
                    }`}
                    color={STATUS[j.status]?.color || "default"}
                  />
                  {j.ytUrl ? (
                    <Link href={j.ytUrl} target="_blank" rel="noopener" variant="caption">
                      YouTube ↗
                    </Link>
                  ) : null}
                  {j.status === "done" && j.ytVideoId ? (
                    <IconButton
                      size="small"
                      title="Sửa tiêu đề/mô tả"
                      onClick={() => {
                        setEditJob(editJob === j._id ? "" : j._id);
                        setEditVals({
                          title: j.ytTitle || j.fbTitle || "",
                          description: j.fbDescription || "",
                        });
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                  {["failed", "canceled"].includes(j.status) ? (
                    <IconButton size="small" title="Chạy lại" onClick={() => doRetry(j._id)}>
                      <ReplayIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Stack>
                {editJob === j._id ? (
                  <Stack spacing={1} sx={{ pl: 1, pr: 1, pb: 1.5 }}>
                    <TextField
                      label="Tiêu đề YouTube"
                      size="small"
                      fullWidth
                      value={editVals.title}
                      onChange={(e) => setEditVals((s) => ({ ...s, title: e.target.value }))}
                      inputProps={{ maxLength: 100 }}
                      helperText={`${editVals.title.length}/100 ký tự`}
                    />
                    <TextField
                      label="Mô tả YouTube"
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                      maxRows={6}
                      value={editVals.description}
                      onChange={(e) =>
                        setEditVals((s) => ({ ...s, description: e.target.value }))
                      }
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => setEditJob("")}>
                        Huỷ
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={savingMeta || !editVals.title.trim()}
                        onClick={() => saveMeta(j._id)}
                      >
                        {savingMeta ? "Đang lưu…" : "Lưu lên YouTube"}
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      </Box>
    </DashboardLayout>
  );
}
