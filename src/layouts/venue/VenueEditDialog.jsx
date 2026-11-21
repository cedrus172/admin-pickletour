/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
} from "dreamspos/ui";

import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { useUpdateVenueAdminMutation } from "slices/venueAdminApiSlice";

const toForm = (v = {}) => ({
  name: v.name || "",
  phone: v.phone || "",
  address: v.address || "",
  province: v.province || "",
  description: v.description || "",
  defaultPricePerHour: v.defaultPricePerHour ?? 0,
  slotMinutes: v.slotMinutes ?? 60,
  depositPercent: v.depositPercent ?? 0,
  commissionPercent: v.commissionPercent ?? 0,
  cancelHoursBefore: v.cancelPolicy?.hoursBefore ?? 0,
  cancelNote: v.cancelPolicy?.note || "",
  bankShortName: v.bankShortName || "",
  bankCode: v.bankCode || "",
  bankAccountNumber: v.bankAccountNumber || "",
  bankAccountName: v.bankAccountName || "",
  clipAutoApprove: !!v.clipAutoApprove,
});

function Section({ children }) {
  return (
    <Grid item xs={12}>
      <Divider sx={{ my: 0.5 }} />
      <MDTypography variant="button" fontWeight="bold" color="info">
        {children}
      </MDTypography>
    </Grid>
  );
}

/** Popup sửa thông tin cụm sân (admin). `venue` = bản ghi Venue đầy đủ; null = đóng. */
export default function VenueEditDialog({ venue, onClose, onSaved }) {
  const [f, setF] = useState(toForm());
  const [update, { isLoading }] = useUpdateVenueAdminMutation();

  useEffect(() => {
    if (venue) setF(toForm(venue));
  }, [venue]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const numProps = (k, min, max, step = 1) => ({
    type: "number",
    value: f[k],
    onChange: set(k),
    inputProps: { min, max, step },
    fullWidth: true,
    size: "small",
  });

  const save = async () => {
    if (!f.name.trim()) {
      toast.error("Cần nhập tên cụm sân");
      return;
    }
    try {
      await update({
        id: venue._id,
        name: f.name,
        phone: f.phone,
        address: f.address,
        province: f.province,
        description: f.description,
        defaultPricePerHour: Number(f.defaultPricePerHour) || 0,
        slotMinutes: Number(f.slotMinutes) || 60,
        depositPercent: Number(f.depositPercent) || 0,
        commissionPercent: Number(f.commissionPercent) || 0,
        cancelPolicy: { hoursBefore: Number(f.cancelHoursBefore) || 0, note: f.cancelNote },
        bankShortName: f.bankShortName,
        bankCode: f.bankCode,
        bankAccountNumber: f.bankAccountNumber,
        bankAccountName: f.bankAccountName,
        clipAutoApprove: f.clipAutoApprove,
      }).unwrap();
      toast.success("Đã lưu thông tin cụm sân");
      onSaved?.();
      onClose?.();
    } catch (e) {
      toast.error(e?.data?.message || "Lưu thất bại");
    }
  };

  const tf = (k, label, extra = {}) => (
    <TextField label={label} value={f[k]} onChange={set(k)} fullWidth size="small" {...extra} />
  );

  return (
    <Dialog open={!!venue} onClose={isLoading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sửa cụm sân</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>{tf("name", "Tên cụm sân *")}</Grid>
          <Grid item xs={12} md={4}>{tf("phone", "SĐT liên hệ")}</Grid>
          <Grid item xs={12} md={8}>{tf("address", "Địa chỉ")}</Grid>
          <Grid item xs={12} md={4}>{tf("province", "Tỉnh/TP")}</Grid>
          <Grid item xs={12}>{tf("description", "Mô tả", { multiline: true, minRows: 2 })}</Grid>

          <Section>Giá &amp; đặt sân</Section>
          <Grid item xs={6} md={3}>
            <TextField label="Giá mặc định (đ/giờ)" {...numProps("defaultPricePerHour", 0, 1e9, 1000)} />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField label="Bước đặt (phút)" {...numProps("slotMinutes", 15, 240, 15)} />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField label="Đặt cọc (%)" {...numProps("depositPercent", 0, 100)} />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField label="Hoa hồng nền tảng (%)" {...numProps("commissionPercent", 0, 100)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Cho tự huỷ trước (giờ)" {...numProps("cancelHoursBefore", 0, 168)} />
          </Grid>
          <Grid item xs={12} md={8}>{tf("cancelNote", "Ghi chú chính sách huỷ")}</Grid>

          <Section>Nhận thanh toán (QR chuyển khoản)</Section>
          <Grid item xs={6} md={3}>{tf("bankShortName", "Ngân hàng (vd MBBank)")}</Grid>
          <Grid item xs={6} md={2}>{tf("bankCode", "Mã NH")}</Grid>
          <Grid item xs={12} md={3}>{tf("bankAccountNumber", "Số tài khoản")}</Grid>
          <Grid item xs={12} md={4}>{tf("bankAccountName", "Tên chủ tài khoản")}</Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={f.clipAutoApprove}
                  onChange={(e) => setF((s) => ({ ...s, clipAutoApprove: e.target.checked }))}
                />
              }
              label="Tự duyệt yêu cầu cắt clip ngoài khung giờ đặt"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <MDButton variant="text" color="secondary" onClick={onClose} disabled={isLoading}>
          Huỷ
        </MDButton>
        <MDButton variant="gradient" color="info" onClick={save} disabled={isLoading}>
          {isLoading ? "Đang lưu…" : "Lưu"}
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}
