// src/pages/admin/CmsHeroEditor.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Stack,
  Card,
  Alert,
  Skeleton,
  LinearProgress,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useUploadAvatarMutation } from "slices/tournamentsApiSlice";
import { useGetHeroContentQuery, useUpdateHeroContentMutation } from "slices/cmsApiSlice";
import PropTypes from "prop-types";
import { useUploadV2Mutation } from "slices/uploadApiSlice";

const MAX_IMG_SIZE = 10 * 1024 * 1024; // 10MB

function FieldSkeleton({ height = 56 }) {
  return <Skeleton variant="rounded" height={height} />;
}
FieldSkeleton.propTypes = {
  height: PropTypes.number,
};

export default function CmsHeroEditor() {
  const { data, isFetching, error, refetch } = useGetHeroContentQuery();
  const [updateHero, { isLoading: saving }] = useUpdateHeroContentMutation();
  const [uploadAvatar] = useUploadAvatarMutation();
  const [uploadV2] = useUploadV2Mutation();

  // ✅ thêm overlayLogoUrl / overlayLogoAlt
  const [form, setForm] = useState({
    title: "",
    lead: "",
    imageUrl: "",
    imageAlt: "",
    overlayLogoUrl: "",
    overlayLogoAlt: "",
  });

  // input ảnh hero
  const fileInputRef = useRef(null);
  // input ảnh logo overlay
  const overlayFileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [overlayUploading, setOverlayUploading] = useState(false);

  // skeleton preview khi ảnh hero đổi
  const [imgLoading, setImgLoading] = useState(false);
  useEffect(() => {
    if (form.imageUrl) setImgLoading(true);
    else setImgLoading(false);
  }, [form.imageUrl]);

  // skeleton preview khi ảnh overlay đổi
  const [overlayImgLoading, setOverlayImgLoading] = useState(false);
  useEffect(() => {
    if (form.overlayLogoUrl) setOverlayImgLoading(true);
    else setOverlayImgLoading(false);
  }, [form.overlayLogoUrl]);

  // Lúc có data → fill form
  useEffect(() => {
    if (!data) return;
    setForm((f) => ({
      ...f,
      title: data.title ?? f.title,
      lead: data.lead ?? f.lead,
      imageUrl: data.imageUrl ?? f.imageUrl,
      imageAlt: data.imageAlt ?? f.imageAlt,
      // ✅ nhận thêm logo overlay từ BE (nếu chưa có thì để rỗng)
      overlayLogoUrl: data.overlayLogoUrl ?? f.overlayLogoUrl,
      overlayLogoAlt: data.overlayLogoAlt ?? f.overlayLogoAlt,
    }));
  }, [data]);

  const onChange = useCallback(
    (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const pickFile = useCallback(() => fileInputRef.current?.click(), []);
  const clearImage = useCallback(() => setForm((prev) => ({ ...prev, imageUrl: "" })), []);

  const pickOverlayFile = useCallback(() => overlayFileInputRef.current?.click(), []);
  const clearOverlayImage = useCallback(
    () => setForm((prev) => ({ ...prev, overlayLogoUrl: "" })),
    []
  );

  // ===== upload ảnh hero =====
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng file ảnh (PNG/JPG/WebP...)");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMG_SIZE) {
      toast.error("Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const res = await uploadAvatar(file).unwrap();
      const url =
        res?.url || res?.path || res?.secure_url || res?.data?.url || res?.data?.path || "";
      if (!url) throw new Error("Không tìm thấy URL ảnh từ server");

      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Tải ảnh Hero thành công");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Upload ảnh hero thất bại");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ===== upload ảnh logo overlay (logic y hệt hero) =====
  const handleOverlayFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng file ảnh (PNG/JPG/WebP...)");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMG_SIZE) {
      toast.error("Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.");
      e.target.value = "";
      return;
    }

    try {
      setOverlayUploading(true);
      const res = await uploadV2({
        file,
        format: "webp",
        width: 75,
        height: 75,
        quality: 80,
      }).unwrap();
      const url =
        res?.url || res?.path || res?.secure_url || res?.data?.url || res?.data?.path || "";
      if (!url) throw new Error("Không tìm thấy URL ảnh từ server");

      setForm((prev) => ({ ...prev, overlayLogoUrl: url }));
      toast.success("Tải logo overlay thành công");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Upload logo overlay thất bại");
    } finally {
      setOverlayUploading(false);
      e.target.value = "";
    }
  };

  const onSave = async () => {
    if (!form.title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }
    try {
      await updateHero({
        title: form.title.trim(),
        lead: form.lead,
        imageUrl: form.imageUrl,
        imageAlt: form.imageAlt,
        // ✅ gửi thêm 2 field mới
        overlayLogoUrl: form.overlayLogoUrl,
        overlayLogoAlt: form.overlayLogoAlt,
      }).unwrap();
      toast.success("Lưu Hero thành công");
      await refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.error || "Lưu thất bại");
    }
  };

  const showSkeleton = isFetching && !data;
  const disabledAll = saving || uploading || overlayUploading || isFetching;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box p={3} sx={{ backgroundColor: "background.paper", borderRadius: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4">Chỉnh sửa Hero & Logo overlay</Typography>
        </Stack>

        {(saving || uploading || overlayUploading) && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.data?.message || error.error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* LEFT: Form */}
          <Grid item xs={12} md={7}>
            {showSkeleton ? (
              <Stack spacing={2}>
                <FieldSkeleton />
                <FieldSkeleton height={120} />
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Skeleton variant="text" width={100} sx={{ mb: 1 }} />
                  <Skeleton variant="rounded" width={240} height={135} sx={{ mb: 2 }} />
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Skeleton variant="rounded" width={170} height={36} />
                    <Skeleton variant="rounded" width={90} height={36} />
                  </Stack>
                  <FieldSkeleton />
                  <FieldSkeleton />
                </Card>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Skeleton variant="text" width={110} sx={{ mb: 1 }} />
                  <Skeleton variant="rounded" width={160} height={100} sx={{ mb: 2 }} />
                  <FieldSkeleton />
                  <FieldSkeleton />
                </Card>
              </Stack>
            ) : (
              <>
                <TextField
                  name="title"
                  label="Tiêu đề"
                  value={form.title}
                  onChange={onChange}
                  fullWidth
                  required
                  margin="normal"
                  disabled={disabledAll}
                />
                <TextField
                  name="lead"
                  label="Mô tả (lead)"
                  value={form.lead}
                  onChange={onChange}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  disabled={disabledAll}
                />

                {/* ===== Ảnh Hero cũ ===== */}
                <Card variant="outlined" sx={{ p: 2, mt: 2, display: "grid", gap: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Ảnh Hero
                  </Typography>

                  {form.imageUrl ? (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box
                        sx={{
                          width: 240,
                          height: 135,
                          position: "relative",
                          borderRadius: 1,
                          border: "1px solid rgba(0,0,0,0.12)",
                          overflow: "hidden",
                        }}
                      >
                        {imgLoading && <Skeleton variant="rounded" width="100%" height="100%" />}
                        {/* eslint-disable-next-line */}
                        <img
                          src={form.imageUrl}
                          referrerPolicy="no-referrer"
                          alt="preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: imgLoading ? "none" : "block",
                          }}
                          onLoad={() => setImgLoading(false)}
                          onError={() => setImgLoading(false)}
                        />
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={pickFile} disabled={disabledAll}>
                          {uploading ? "Đang tải..." : "Thay ảnh (Upload)"}
                        </Button>
                        <Button
                          variant="text"
                          color="error"
                          onClick={clearImage}
                          disabled={disabledAll}
                        >
                          Xoá ảnh
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button variant="outlined" onClick={pickFile} disabled={disabledAll}>
                        {uploading ? "Đang tải..." : "Chọn ảnh từ máy (Upload)"}
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        PNG/JPG/WebP • ≤ 10MB. Sau khi chọn sẽ tự upload.
                      </Typography>
                    </Stack>
                  )}

                  {/* file input ẩn - hero */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  <TextField
                    name="imageUrl"
                    label="Ảnh (URL)"
                    value={form.imageUrl}
                    onChange={onChange}
                    fullWidth
                    margin="normal"
                    disabled={disabledAll}
                    helperText="Có thể dán URL ảnh trực tiếp nếu đã có."
                  />
                  <TextField
                    name="imageAlt"
                    label="Mô tả ảnh (alt)"
                    value={form.imageAlt}
                    onChange={onChange}
                    fullWidth
                    margin="normal"
                    disabled={disabledAll}
                  />
                </Card>

                {/* ===== Ảnh Logo Overlay (y hệt hero) ===== */}
                <Card variant="outlined" sx={{ p: 2, mt: 2, display: "grid", gap: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Ảnh Logo Overlay
                  </Typography>

                  {form.overlayLogoUrl ? (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box
                        sx={{
                          width: 180,
                          height: 120,
                          position: "relative",
                          borderRadius: 1,
                          border: "1px solid rgba(0,0,0,0.12)",
                          overflow: "hidden",
                          bgcolor: "#fff",
                        }}
                      >
                        {overlayImgLoading && (
                          <Skeleton variant="rounded" width="100%" height="100%" />
                        )}
                        {/* eslint-disable-next-line */}
                        <img
                          src={form.overlayLogoUrl}
                          referrerPolicy="no-referrer"
                          alt="overlay-logo-preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain", // 👈 logo nên contain
                            display: overlayImgLoading ? "none" : "block",
                          }}
                          onLoad={() => setOverlayImgLoading(false)}
                          onError={() => setOverlayImgLoading(false)}
                        />
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={pickOverlayFile} disabled={disabledAll}>
                          {overlayUploading ? "Đang tải..." : "Thay logo (Upload)"}
                        </Button>
                        <Button
                          variant="text"
                          color="error"
                          onClick={clearOverlayImage}
                          disabled={disabledAll}
                        >
                          Xoá logo
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button variant="outlined" onClick={pickOverlayFile} disabled={disabledAll}>
                        {overlayUploading ? "Đang tải..." : "Chọn logo từ máy (Upload)"}
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        PNG trong suốt càng đẹp • ≤ 10MB.
                      </Typography>
                    </Stack>
                  )}

                  {/* file input ẩn - overlay */}
                  <input
                    ref={overlayFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleOverlayFileChange}
                    style={{ display: "none" }}
                  />

                  <TextField
                    name="overlayLogoUrl"
                    label="Logo overlay (URL)"
                    value={form.overlayLogoUrl}
                    onChange={onChange}
                    fullWidth
                    margin="normal"
                    disabled={disabledAll}
                    helperText="Dán URL ảnh logo overlay nếu đã upload ở nơi khác."
                  />
                  <TextField
                    name="overlayLogoAlt"
                    label="Mô tả logo overlay (alt)"
                    value={form.overlayLogoAlt}
                    onChange={onChange}
                    fullWidth
                    margin="normal"
                    disabled={disabledAll}
                  />
                </Card>

                <Stack direction="row" spacing={2} mt={3}>
                  <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={disabledAll}
                    sx={{
                      backgroundColor: "#1976d2",
                      "&:hover": { backgroundColor: "#1565c0" },
                    }}
                  >
                    {saving ? "Đang lưu..." : "Lưu"}
                  </Button>
                  <Button variant="outlined" onClick={() => refetch()} disabled={disabledAll}>
                    Tải lại
                  </Button>
                </Stack>
              </>
            )}
          </Grid>

          {/* RIGHT: Preview */}
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Card variant="outlined" sx={{ p: 2 }}>
              {showSkeleton ? (
                <>
                  <Skeleton variant="text" width="70%" height={36} />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
                  <Divider sx={{ my: 1.5 }} />
                  <Skeleton variant="rounded" width="100%" sx={{ aspectRatio: "16/9" }} />
                </>
              ) : (
                <>
                  <Typography variant="h4" gutterBottom>
                    {form.title || "Tiêu đề sẽ hiển thị tại đây"}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {form.lead || "Mô tả (lead) sẽ hiển thị tại đây"}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Box
                    sx={{
                      width: "100%",
                      aspectRatio: "16/9",
                      overflow: "hidden",
                      borderRadius: 2,
                      boxShadow: 1,
                      bgcolor: "#f5f5f5",
                      position: "relative",
                    }}
                  >
                    {imgLoading && <Skeleton variant="rounded" width="100%" height="100%" />}
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt={form.imageAlt || "Hero image"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: imgLoading ? "none" : "block",
                        }}
                        onLoad={() => setImgLoading(false)}
                        onError={() => setImgLoading(false)}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "text.secondary",
                          fontSize: 14,
                        }}
                      >
                        Chưa có ảnh
                      </Box>
                    )}

                    {/* ✅ Preview logo overlay ở góc trên phải giống overlay khi live */}
                  </Box>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
