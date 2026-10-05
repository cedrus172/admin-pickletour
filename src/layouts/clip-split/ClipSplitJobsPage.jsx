/* eslint-disable react/prop-types */
// Trang theo dõi TẤT CẢ job "cắt clip trận → Google Drive" của mọi giải.
// Tự refresh 2s; hiện MB đã tải / tổng, %, tốc độ, ETA, bước hiện tại, log.
import React, { useState } from "react";
import {
  Box,
  Card,
  Stack,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplayIcon from "@mui/icons-material/Replay";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import {
  useClipSplitJobsQuery,
  useStartClipSplitMutation,
  useStartMigrateMutation,
} from "slices/clipSplitApiSlice";

const fmtBytes = (n) => {
  const b = Number(n || 0);
  if (!b) return "0 MB";
  if (b >= 1 << 30) return (b / (1 << 30)).toFixed(2) + " GB";
  return (b / (1 << 20)).toFixed(1) + " MB";
};
const fmtSpeed = (n) => (Number(n) ? fmtBytes(n) + "/s" : "—");
const fmtEta = (s) => {
  const v = Number(s || 0);
  if (!v) return "—";
  const m = Math.floor(v / 60);
  const ss = Math.floor(v % 60);
  return m ? `${m}m${String(ss).padStart(2, "0")}s` : `${ss}s`;
};

const STATE_COLOR = {
  running: "info",
  done: "success",
  error: "error",
  idle: "default",
};
const STATE_LABEL = {
  running: "Đang chạy",
  done: "Hoàn tất",
  error: "Lỗi",
  idle: "Chờ",
};
const PHASE_LABEL = {
  download: "Đang tải",
  cut: "Đang cắt",
  upload: "Đang up Drive",
  "upload-tg": "Đang up Telegram",
};

function CurrentActivity({ cur }) {
  if (!cur) return null;
  const phase = PHASE_LABEL[cur.phase] || cur.phase;
  const pct = Math.max(0, Math.min(100, Number(cur.percent || 0)));

  let detail;
  if (cur.phase === "download") {
    const what = cur.videoId ? `clip ${cur.videoId}` : cur.title || "";
    detail = `${phase} ${what}: ${fmtBytes(cur.downloadedBytes)} / ${
      cur.totalBytes ? fmtBytes(cur.totalBytes) : "?"
    } · ${pct.toFixed(1)}%${cur.speed ? ` · ${fmtSpeed(cur.speed)}` : ""}${
      cur.eta ? ` · ETA ${fmtEta(cur.eta)}` : ""
    }`;
  } else if (cur.phase === "upload") {
    detail = `${phase} trận ${cur.segIndex}/${cur.segTotal}${
      cur.title ? ` · ${cur.title}` : ""
    } · ${fmtBytes(cur.uploadedBytes)} / ${
      cur.totalBytes ? fmtBytes(cur.totalBytes) : "?"
    } · ${pct.toFixed(1)}% · ${fmtSpeed(cur.speed)} · ETA ${fmtEta(cur.eta)}`;
  } else if (cur.phase === "upload-tg") {
    detail = `${phase} trận ${cur.segIndex}/${cur.segTotal}${
      cur.title ? ` · ${cur.title}` : ""
    }${cur.totalBytes ? ` · ${fmtBytes(cur.totalBytes)}` : ""}${
      pct > 0 ? ` · ${pct.toFixed(1)}%` : ""
    }`;
  } else {
    // cut
    detail = `${phase} trận ${cur.segIndex}/${cur.segTotal}${
      cur.title ? ` · ${cur.title}` : ""
    } · ${pct.toFixed(1)}%`;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {detail}
      </Typography>
      <LinearProgress
        variant={pct > 0 ? "determinate" : "indeterminate"}
        value={pct}
        sx={{ mt: 0.5 }}
      />
    </Box>
  );
}

function JobCard({ job }) {
  const [open, setOpen] = useState(false);
  const total = Number(job.total || 0);
  const done = Number(job.done || 0);
  const failed = Number(job.failed || 0);
  const overall = total ? Math.round(((done + failed) / total) * 100) : 0;
  const color = STATE_COLOR[job.state] || "default";

  const [startClip, { isLoading: clipRetrying }] = useStartClipSplitMutation();
  const [startMigrate, { isLoading: migRetrying }] = useStartMigrateMutation();
  const retrying = clipRetrying || migRetrying;
  // Còn trận chưa xong (lỗi/dang dở) + không đang chạy → cho chạy lại. Chạy lại =
  // start lại KHÔNG truyền matchIds + force=false → tự BỎ QUA trận đã xong, chỉ cắt
  // lại các trận còn thiếu (lỗi). Áp dụng cho cả cắt clip và migrate.
  const hasPending = job.state === "error" || (total > 0 && done < total);
  const canRetry = job.state !== "running" && hasPending;
  const retryFailed = async () => {
    try {
      if (job.kind === "migrate") await startMigrate({ tournamentId: job.tournament }).unwrap();
      else await startClip({ tournamentId: job.tournament, force: false }).unwrap();
    } catch (e) {
      // lỗi hiển thị qua polling state; không chặn UI
    }
  };

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Chip size="small" color={color} label={STATE_LABEL[job.state] || job.state} />
        <Chip
          size="small"
          variant="outlined"
          label={job.kind === "migrate" ? "Drive→Telegram" : "Cắt clip"}
        />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {job.tournamentName || "(giải)"}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {done}/{total} xong{failed ? ` · ${failed} lỗi` : ""}
          {job.state === "running" && job.etaSec != null
            ? ` · còn ~${fmtEta(job.etaSec)}`
            : ""}
        </Typography>
        {canRetry ? (
          <Tooltip title="Chạy lại các trận bị lỗi (bỏ qua trận đã xong)">
            <span>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<ReplayIcon fontSize="small" />}
                onClick={retryFailed}
                disabled={retrying}
                sx={{ textTransform: "none" }}
              >
                {retrying ? "Đang chạy lại…" : `Chạy lại trận lỗi${failed ? ` (${failed})` : ""}`}
              </Button>
            </span>
          </Tooltip>
        ) : null}
        <Tooltip title="Mở trang giải">
          <IconButton
            size="small"
            component="a"
            href={`/admin/tournaments/${job.tournament}/brackets`}
            target="_blank"
            rel="noopener"
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={() => setOpen((v) => !v)}>
          <ExpandMoreIcon
            fontSize="small"
            sx={{ transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}
          />
        </IconButton>
      </Stack>

      {total ? (
        <LinearProgress
          variant="determinate"
          value={overall}
          color={color === "default" ? "info" : color}
          sx={{ mt: 1 }}
        />
      ) : null}

      <CurrentActivity cur={job.current} />

      {job.error ? (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
          {job.error}
        </Typography>
      ) : null}

      {Array.isArray(job.results) && job.results.length > 0 ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Trận đã xong ({job.results.length}) — link Google Drive:
          </Typography>
          <Stack spacing={0.5}>
            {job.results.map((r) => (
              <Stack
                key={r.fileId || r.matchId}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ flexWrap: "wrap" }}
              >
                <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 180 }}>
                  {r.title || r.matchId}
                  {r.sizeBytes ? (
                    <Typography component="span" variant="caption" color="text.secondary">
                      {" "}
                      · {fmtBytes(r.sizeBytes)}
                    </Typography>
                  ) : null}
                </Typography>
                {r.fileId ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon fontSize="small" />}
                    component="a"
                    href={r.viewUrl || `https://drive.google.com/file/d/${r.fileId}/view`}
                    target="_blank"
                    rel="noopener"
                  >
                    Drive
                  </Button>
                ) : null}
                {r.telegramUrl ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    startIcon={<OpenInNewIcon fontSize="small" />}
                    component="a"
                    href={r.telegramUrl}
                    target="_blank"
                    rel="noopener"
                  >
                    Telegram
                  </Button>
                ) : null}
                <Tooltip title="Copy link (Drive ưu tiên, không có thì Telegram)">
                  <IconButton
                    size="small"
                    onClick={() => {
                      const link =
                        r.viewUrl ||
                        (r.fileId
                          ? `https://drive.google.com/file/d/${r.fileId}/view`
                          : "") ||
                        r.telegramUrl ||
                        "";
                      try {
                        navigator.clipboard.writeText(link);
                      } catch (e) {
                        /* noop */
                      }
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Collapse in={open} unmountOnExit>
        <Divider sx={{ my: 1 }} />
        <Box
          sx={{
            maxHeight: 240,
            overflow: "auto",
            bgcolor: "grey.100",
            borderRadius: 1,
            p: 1,
            fontFamily: "monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {(job.logs || []).slice(-80).join("\n") || "(chưa có log)"}
        </Box>
      </Collapse>
    </Card>
  );
}

export default function ClipSplitJobsPage() {
  const { data, isFetching, refetch } = useClipSplitJobsQuery(undefined, {
    pollingInterval: 2000,
  });
  const jobs = data?.jobs || [];
  const running = jobs.filter((j) => j.state === "running").length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box py={3}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Theo dõi cắt clip → Drive
          </Typography>
          <Chip size="small" color="info" label={`${running} đang chạy`} />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={refetch}
            disabled={isFetching}
          >
            Làm mới
          </Button>
        </Stack>

        {jobs.length === 0 ? (
          <Card sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              Chưa có job nào. Vào một giải → trang Brackets → “Cắt &amp; up từng trận”.
            </Typography>
          </Card>
        ) : (
          jobs.map((j) => <JobCard key={String(j.tournament)} job={j} />)
        )}
      </Box>
      <Footer />
    </DashboardLayout>
  );
}
