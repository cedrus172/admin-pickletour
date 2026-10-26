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
  useAddCamClipGrantMutation,
  useSetCamClipConfigMutation,
  useRemoveCamClipGrantMutation,
} = camClipApiSlice;
