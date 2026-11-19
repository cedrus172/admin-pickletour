// layouts/shop/ShopSettingsPage.jsx — Gian hàng độc quyền GOATWIN (admin):
// bật/tắt (tất cả / chỉ admin + người quản lý / tắt), cấp quyền quản lý gian hàng trong app cho tài khoản GOATWIN,
// thông tin gian hàng + tài khoản nhận chuyển khoản (QR VietQR). Sản phẩm & đơn hàng quản lý ngay trong app PickleTour.
import React from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { toast } from "react-toastify";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useGetShopConfigQuery, useSaveShopConfigMutation } from "slices/shopAdminApiSlice";
import { useGetUsersQuery } from "slices/adminApiSlice";

const VIS = [
  { v: "all", label: "Bật cho tất cả", desc: "Mọi người thấy thẻ GOATWIN ở trang chủ, vào cửa hàng và đặt hàng." },
  { v: "admin", label: "Chỉ admin + người quản lý gian hàng", desc: "Để thử / chuẩn bị sản phẩm; người dùng thường không thấy." },
  { v: "off", label: "Tắt", desc: "Ẩn với tất cả (kể cả admin). Người quản lý vẫn xử lý được đơn cũ trong app." },
];

function Field({ label, value, onChange, ...rest }) {
  return <TextField fullWidth size="small" label={label} value={value || ""} onChange={(e) => onChange(e.target.value)} {...rest} />;
}
Field.propTypes = { label: PropTypes.string, value: PropTypes.string, onChange: PropTypes.func.isRequired };

export default function ShopSettingsPage() {
  const { data, isLoading, error, refetch } = useGetShopConfigQuery();
  const [save, { isLoading: saving }] = useSaveShopConfigMutation();
  const [cfg, setCfg] = React.useState(null);
  const [managers, setManagers] = React.useState([]);
  const [kw, setKw] = React.useState("");
  const { data: found, isFetching: searching } = useGetUsersQuery({ page: 1, keyword: kw, pageSize: 10 }, { skip: kw.trim().length < 2 });

  React.useEffect(() => {
    if (data?.config) {
      setCfg(data.config);
      setManagers(data.managers || []);
    }
  }, [data]);

  const set = (k) => (v) => setCfg((c) => ({ ...c, [k]: v }));
  const setBank = (k) => (v) => setCfg((c) => ({ ...c, bank: { ...(c.bank || {}), [k]: v } }));
  const options = (found?.users || found?.items || []).filter((u) => !managers.some((m) => String(m._id) === String(u._id)));

  const doSave = async () => {
    try {
      const r = await save({ ...cfg, managers: managers.map((m) => m._id) }).unwrap();
      setManagers(r.managers || []);
      toast.success("Đã lưu cài đặt gian hàng");
    } catch (e) {
      toast.error(e?.data?.message || "Không lưu được");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1000 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <StorefrontIcon color="error" />
          <Typography variant="h4">Gian hàng GOATWIN</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sản phẩm và đơn hàng do người quản lý gian hàng tự xử lý ngay trong app PickleTour (Khác → Quản lý gian hàng: thêm sản phẩm, xử lý đơn, quét
          mã đơn).
        </Typography>
        {isLoading || !cfg ? (
          error ? (
            <Alert severity="error" action={<Button onClick={refetch}>Thử lại</Button>}>
              {error?.data?.message || "Không tải được cài đặt"}
            </Alert>
          ) : (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          )
        ) : (
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Bật / tắt gian hàng
              </Typography>
              <RadioGroup value={cfg.visibility || "admin"} onChange={(e) => set("visibility")(e.target.value)}>
                {VIS.map((o) => (
                  <FormControlLabel
                    key={o.v}
                    value={o.v}
                    control={<Radio />}
                    label={
                      <Box sx={{ py: 0.5 }}>
                        <Typography fontWeight={700}>{o.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {o.desc}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800}>
                Người quản lý gian hàng
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Tài khoản bên GOATWIN được thêm/sửa sản phẩm, xử lý đơn, xác nhận thanh toán và quét mã đơn trong app. Họ nhận thông báo khi có đơn mới.
              </Typography>
              <Autocomplete
                options={options}
                loading={searching}
                filterOptions={(x) => x}
                getOptionLabel={(u) => `${u.name || ""}${u.nickname ? ` (${u.nickname})` : ""}${u.phone ? ` · ${u.phone}` : ""}`}
                onInputChange={(_, v) => setKw(v)}
                onChange={(_, u) => u && setManagers((m) => [...m, { _id: u._id, name: u.name, nickname: u.nickname, phone: u.phone, avatar: u.avatar }])}
                value={null}
                renderInput={(p) => <TextField {...p} size="small" label="Tìm tài khoản (tên, biệt danh, SĐT)…" />}
                sx={{ mb: 1.5 }}
              />
              <Stack spacing={1}>
                {managers.length ? (
                  managers.map((m) => (
                    <Stack key={m._id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <Avatar src={m.avatar || undefined} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>
                          {m.name || m.nickname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[m.nickname, m.phone].filter(Boolean).join(" · ")}
                        </Typography>
                      </Box>
                      <IconButton aria-label="Bỏ quyền" onClick={() => setManagers((x) => x.filter((y) => y._id !== m._id))}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có ai — admin hệ thống luôn quản lý được.
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                Thông tin gian hàng
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <Field label="Tiêu đề thẻ trang chủ" value={cfg.title} onChange={set("title")} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Nhãn khuyến mãi (vd. Giảm đến 20%)" value={cfg.promoLabel} onChange={set("promoLabel")} />
                </Grid>
                <Grid item xs={12}>
                  <Field label="Mô tả ngắn" value={cfg.subtitle} onChange={set("subtitle")} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Dòng đối tác" value={cfg.partnerText} onChange={set("partnerText")} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Ghi chú giao hàng" value={cfg.shippingNote} onChange={set("shippingNote")} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Hotline" value={cfg.hotline} onChange={set("hotline")} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Zalo (SĐT hoặc link)" value={cfg.zalo} onChange={set("zalo")} />
                </Grid>
              </Grid>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800}>
                Nhận chuyển khoản (QR)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Điền đủ thì khách chọn được &quot;Chuyển khoản QR&quot;: app hiện mã VietQR đúng số tiền, nội dung = mã đơn. Người quản lý đối soát rồi bấm
                &quot;Đã thanh toán&quot;. Để trống = chỉ COD.
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <Field label="Mã ngân hàng (BIN, vd. 970436)" value={cfg.bank?.bin} onChange={setBank("bin")} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field label="Số tài khoản" value={cfg.bank?.accountNo} onChange={setBank("accountNo")} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field label="Tên chủ tài khoản" value={cfg.bank?.accountName} onChange={setBank("accountName")} />
                </Grid>
              </Grid>
              {cfg.bank?.bin && cfg.bank?.accountNo ? <Chip sx={{ mt: 1.5 }} color="success" label="Đã bật thanh toán QR" /> : null}
            </Paper>

            <Box>
              <Button variant="contained" size="large" onClick={doSave} disabled={saving} sx={{ color: "#fff !important" }}>
                {saving ? "Đang lưu…" : "Lưu cài đặt"}
              </Button>
            </Box>
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}
