// src/slices/studioAdminApiSlice.js — Bản quyền Pickletour Studio + chia sẻ page Facebook + thiết bị Studio
import { apiSlice } from "./apiSlice";

export const studioAdminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStudioLicenses: builder.query({
      query: () => "/admin/studio/licenses",
      providesTags: ["StudioLicenses"],
    }),
    searchStudioUsers: builder.query({
      query: (keyword) => `/admin/studio/users?keyword=${encodeURIComponent(keyword || "")}`,
      providesTags: ["StudioLicenses"],
    }),
    upsertStudioLicense: builder.mutation({
      query: ({ userId, ...body }) => ({
        url: `/admin/studio/licenses/${userId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["StudioLicenses"],
    }),
    deleteStudioLicense: builder.mutation({
      query: (userId) => ({ url: `/admin/studio/licenses/${userId}`, method: "DELETE" }),
      invalidatesTags: ["StudioLicenses"],
    }),
    getStudioRtspSources: builder.query({
      query: () => "/admin/studio/rtsp-sources",
    }),
    updateStudioSettings: builder.mutation({
      query: (body) => ({ url: "/admin/studio/settings", method: "PUT", body }),
      invalidatesTags: ["StudioLicenses"],
    }),
    getStudioPages: builder.query({
      query: (keyword) => `/admin/studio/pages?keyword=${encodeURIComponent(keyword || "")}`,
      providesTags: ["StudioPages"],
    }),
    addStudioPageShare: builder.mutation({
      query: ({ connectionId, userId }) => ({
        url: `/admin/studio/pages/${connectionId}/shares`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["StudioPages"],
    }),
    removeStudioPageShare: builder.mutation({
      query: ({ connectionId, userId }) => ({
        url: `/admin/studio/pages/${connectionId}/shares/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StudioPages"],
    }),
    // Thiết bị Studio (nhịp tim từ app)
    getStudioDevices: builder.query({
      query: ({ status = "all", q = "" } = {}) =>
        `/admin/studio/devices?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`,
      providesTags: ["StudioDevices"],
    }),
    getStudioDevice: builder.query({
      query: (id) => `/admin/studio/devices/${id}`,
      providesTags: (_r, _e, id) => [{ type: "StudioDevices", id }],
    }),
    deleteStudioDevice: builder.mutation({
      query: (id) => ({ url: `/admin/studio/devices/${id}`, method: "DELETE" }),
      invalidatesTags: ["StudioDevices"],
    }),
  }),
});

export const {
  useGetStudioLicensesQuery,
  useLazySearchStudioUsersQuery,
  useUpsertStudioLicenseMutation,
  useDeleteStudioLicenseMutation,
  useGetStudioRtspSourcesQuery,
  useUpdateStudioSettingsMutation,
  useGetStudioPagesQuery,
  useAddStudioPageShareMutation,
  useRemoveStudioPageShareMutation,
  useGetStudioDevicesQuery,
  useGetStudioDeviceQuery,
  useDeleteStudioDeviceMutation,
} = studioAdminApiSlice;
