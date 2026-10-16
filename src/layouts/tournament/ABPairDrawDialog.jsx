/* eslint-disable react/prop-types */
// Bốc thăm ghép cặp theo trình A–B: nhập 2 danh sách (trình A, trình B), xáo &
// ghép A↔B thành các cặp (10A+10B -> 10 cặp). Lệch số -> cặp dư để chờ. Tạo cặp
// tái dùng endpoint roster-import (tạo VĐV khách + dedup tài khoản theo SĐT).
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { useImportRosterMutation } from "slices/tournamentsApiSlice";

// 1 VĐV / dòng: "Tên, SĐT, Điểm" (phân tách bởi dấu phẩy hoặc tab). Chỉ Tên là bắt buộc.
function parseList(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[\t,;]+/).map((s) => s.trim());
      return { name: parts[0] || "", phone: parts[1] || "", score: parts[2] || "" };
    })
    .filter((p) => p.name);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ABPairDrawDialog({ open, onClose, tournamentId, onDone }) {
  const [aText, setAText] = useState("");
  const [bText, setBText] = useState("");
  const [pairs, setPairs] = useState([]); // [{a, b}]
  const [leftover, setLeftover] = useState([]); // VĐV dư (lệch số)
  const [markInternal, setMarkInternal] = useState(true);
  const [msg, setMsg] = useState("");
  const [importRoster, { isLoading }] = useImportRosterMutation();

  const aList = useMemo(() => parseList(aText), [aText]);
  const bList = useMemo(() => parseList(bText), [bText]);

  const doDraw = () => {
    setMsg("");
    const A = shuffle(aList);
    const B = shuffle(bList);
    const n = Math.min(A.length, B.length);
    const pr = [];
    for (let i = 0; i < n; i++) pr.push({ a: A[i], b: B[i] });
    const extra = [
      ...A.slice(n).map((p) => ({ ...p, side: "A" })),
      ...B.slice(n).map((p) => ({ ...p, side: "B" })),
    ];
    setPairs(pr);
    setLeftover(extra);
  };

  const commit = async () => {
    setMsg("");
    if (!pairs.length) {
      setMsg("Chưa có cặp nào — bấm Bốc thăm trước.");
      return;
    }
    try {
      const body = pairs.map((p) => ({
        p1: { name: p.a.name, phone: p.a.phone, score: p.a.score },
        p2: { name: p.b.name, phone: p.b.phone, score: p.b.score },
      }));
      const res = await importRoster({
        tourId: tournamentId,
        pairs: body,
        dryRun: false,
        markInternal,
      }).unwrap();
      const s = res?.summary || {};
      setMsg(
        `Đã tạo ${s.registrationsToCreate ?? body.length} cặp` +
          (s.guestsToCreate ? ` · ${s.guestsToCreate} VĐV khách mới` : "") +
          (s.reusedAccounts ? ` · ${s.reusedAccounts} dùng lại tài khoản` : "")
      );
      onDone?.();
    } catch (e) {
      setMsg(e?.data?.message || e?.message || "Tạo cặp thất bại");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bốc thăm ghép cặp trình A–B</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Mỗi dòng 1 VĐV: <b>Tên, SĐT, Điểm</b> (SĐT &amp; Điểm tuỳ chọn; có SĐT sẽ
          tự dùng lại tài khoản đã có). Bốc thăm sẽ ghép ngẫu nhiên 1 VĐV trình A với
          1 VĐV trình B thành 1 cặp.
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label={`Trình A (${aList.length})`}
            value={aText}
            onChange={(e) => setAText(e.target.value)}
            multiline
            minRows={8}
            fullWidth
            placeholder={"Nguyễn Văn A, 0901234567, 3.5\nTrần B\n..."}
          />
          <TextField
            label={`Trình B (${bList.length})`}
            value={bText}
            onChange={(e) => setBText(e.target.value)}
            multiline
            minRows={8}
            fullWidth
            placeholder={"Lê Văn C\nPhạm D, 0987654321\n..."}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1.5 }}>
          <Button variant="contained" startIcon={<CasinoIcon />} onClick={doDraw}
            disabled={!aList.length || !bList.length}>
            {pairs.length ? "Bốc lại" : "Bốc thăm"}
          </Button>
          <FormControlLabel
            control={<Switch checked={markInternal} onChange={(e) => setMarkInternal(e.target.checked)} />}
            label="Giải nội bộ (không cộng BXH)"
          />
        </Stack>

        {leftover.length > 0 && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            Lệch số: {leftover.length} VĐV dư chưa ghép —{" "}
            {leftover.map((p) => `${p.name}(${p.side})`).join(", ")}
          </Alert>
        )}

        {pairs.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {pairs.length} cặp sau bốc thăm
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Trình A</TableCell>
                  <TableCell>Trình B</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pairs.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      {p.a.name} {p.a.phone ? <Chip size="small" label={p.a.phone} /> : null}
                    </TableCell>
                    <TableCell>
                      {p.b.name} {p.b.phone ? <Chip size="small" label={p.b.phone} /> : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {msg && (
          <Alert severity={/thất bại|Chưa/.test(msg) ? "error" : "success"} sx={{ mt: 2 }}>
            {msg}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        <Button variant="contained" onClick={commit} disabled={isLoading || !pairs.length}>
          {isLoading ? "Đang tạo…" : `Tạo ${pairs.length} cặp`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
