// src/slices/camClipApiSlice.js
// Quản lý Quyền Cắt Cam Sân (PickClip) từ admin web.
import { apiSlice } from "./apiSlice";

export const camClipApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Liệt kê venue (đã bật, hoặc tìm theo tên để bật mới).
    adminCamClipVenues: builder.query({
      query: (q) => ({ url: "/cam-clip/admin/venues", params: q ? { q } : {} }),
      providesTags: [{ type: "CamClip", id: "LIST" }],
    }),
    // Cấu hình + danh sách grant của 1 venue.
    camClipGrants: builder.query({
      query: (venueId) => `/cam-clip/venues/${venueId}/grants`,
      providesTags: (r, e, venueId) => [{ type: "CamClip", id: venueId }],
    }),
    // Danh sách camera của sân (proxy từ Pi) để chọn khi cấp quyền từng camera.
    camClipCameras: builder.query({
      query: (venueId) => `/cam-clip/venues/${venueId}/cameras`,
      providesTags: (r, e, venueId) => [{ type: "CamClip", id: `pi-${venueId}` }],
    }),
    // Camera + đầu ghi đang cấu hình trên Pi của sân (admin; máy chủ gọi Pi qua Tailscale).
    camClipPi: builder.query({
      query: (venueId) => `/cam-clip/venues/${venueId}/pi`,
      providesTags: (r, e, venueId) => [{ type: "CamClip", id: `pi-${venueId}` }],
    }),
    addCamClipPiCamera: builder.mutation({
      query: ({ venueId, ...body }) => ({ url: `/cam-clip/venues/${venueId}/pi/cameras`, method: "POST", body }),
      invalidatesTags: (r, e, { venueId }) => [{ type: "CamClip", id: `pi-${venueId}` }],
    }),
    updateCamClipPiCamera: builder.mutation({
      query: ({ venueId, cameraId, ...body }) => ({
        url: `/cam-clip/venues/${venueId}/pi/cameras/${cameraId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (r, e, { venueId }) => [{ type: "CamClip", id: `pi-${venueId}` }],
    }),
    removeCamClipPiCamera: builder.mutation({
      query: ({ venueId, cameraId }) => ({
        url: `/cam-clip/venues/${venueId}/pi/cameras/${cameraId}`,
        method: "DELETE",
      }),
      invalidatesTags: (r, e, { venueId }) => [{ type: "CamClip", id: `pi-${venueId}` }],
    }),
    addCamClipPiNvr: builder.mutation({
      query: ({ venueId, ...body }) => ({ url: `/cam-clip/venues/${venueId}/pi/nvrs`, method: "POST", body }),
      invalidatesTags: (r, e, { venueId }) => [{ type: "CamClip", id: `pi-${venueId}` }],
    }),
    testCamClipPiNvr: builder.mutation({
      query: ({ venueId, nvrId, channel }) => ({
        url: `/cam-clip/venues/${venueId}/pi/nvrs/${nvrId}/test?channel=${channel || 1}`,
        method: "POST",
      }),
    }),
    scanCamClipPiNvr: builder.mutation({
      query: ({ venueId, nvrId }) => `/cam-clip/venues/${venueId}/pi/nvrs/${nvrId}/channels`,
    }),
    addCamClipGrant: builder.mutation({
      query: ({ venueId, ...body }) => ({
        url: `/cam-clip/venues/${venueId}/grants`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { venueId }) => [
        { type: "CamClip", id: venueId },
        { type: "CamClip", id: "LIST" },
      ],
    }),
    setCamClipConfig: builder.mutation({
      query: ({ venueId, ...body }) => ({
        url: `/cam-clip/venues/${venueId}/config`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { venueId }) => [
        { type: "CamClip", id: venueId },
        { type: "CamClip", id: "LIST" },
      ],
    }),
    updateCamClipGrant: builder.mutation({
      query: ({ id, venueId, ...body }) => ({
        url: `/cam-clip/grants/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { venueId }) => [
        { type: "CamClip", id: venueId },
        { type: "CamClip", id: "LIST" },
      ],
    }),
    removeCamClipGrant: builder.mutation({
      query: ({ id }) => ({
        url: `/cam-clip/grants/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (r, e, { venueId }) => [
        { type: "CamClip", id: venueId },
        { type: "CamClip", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useAdminCamClipVenuesQuery,
  useCamClipGrantsQuery,
  useCamClipCamerasQuery,
  useCamClipPiQuery,
  useAddCamClipPiCameraMutation,
  useUpdateCamClipPiCameraMutation,
  useRemoveCamClipPiCameraMutation,
  useAddCamClipPiNvrMutation,
  useTestCamClipPiNvrMutation,
  useScanCamClipPiNvrMutation,
  useAddCamClipGrantMutation,
  useUpdateCamClipGrantMutation,
  useSetCamClipConfigMutation,
  useRemoveCamClipGrantMutation,
} = camClipApiSlice;
