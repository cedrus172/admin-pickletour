// src/slices/fanpageAdminApiSlice.js — duyệt Fanpage (/api/admin/fanpages)
import { apiSlice } from "./apiSlice";

export const fanpageAdminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    adminListFanpages: builder.query({
      query: ({ status = "pending" } = {}) => ({
        url: `/admin/fanpages?status=${encodeURIComponent(status)}`,
        method: "GET",
      }),
      providesTags: ["AdminFanpages"],
    }),
    adminReviewFanpage: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/fanpages/${id}`, method: "PATCH", body }),
      invalidatesTags: ["AdminFanpages"],
    }),
  }),
});

export const { useAdminListFanpagesQuery, useAdminReviewFanpageMutation } = fanpageAdminApiSlice;
