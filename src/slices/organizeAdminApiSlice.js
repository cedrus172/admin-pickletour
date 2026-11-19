// src/slices/organizeAdminApiSlice.js — Yêu cầu tổ chức giải (người dùng gửi từ web/app)
import { apiSlice } from "./apiSlice";

export const organizeAdminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizeRequests: builder.query({
      query: ({ status = "", q = "" } = {}) => `/admin/organize-requests?status=${status}&q=${encodeURIComponent(q)}`,
      providesTags: ["OrganizeRequests"],
    }),
    updateOrganizeRequest: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/organize-requests/${id}`, method: "PATCH", body }),
      invalidatesTags: ["OrganizeRequests"],
    }),
  }),
});

export const { useGetOrganizeRequestsQuery, useUpdateOrganizeRequestMutation } = organizeAdminApiSlice;
