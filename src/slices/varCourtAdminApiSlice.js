// src/slices/varCourtAdminApiSlice.js — Sân VAR: chuẩn bị sân trên máy phân tích (job prepare) + soi thử
import { apiSlice } from "./apiSlice";

export const varCourtAdminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVarCourts: builder.query({
      query: () => `/var/courts?all=1`,
      providesTags: ["VarCourts"],
    }),
    createVarCourt: builder.mutation({
      query: (body) => ({ url: `/var/courts`, method: "POST", body }),
      invalidatesTags: ["VarCourts"],
    }),
    updateVarCourt: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/var/courts/${id}`, method: "PATCH", body }),
      invalidatesTags: ["VarCourts"],
    }),
    deleteVarCourt: builder.mutation({
      query: (id) => ({ url: `/var/courts/${id}`, method: "DELETE" }),
      invalidatesTags: ["VarCourts"],
    }),
    cancelVarCourt: builder.mutation({
      query: (id) => ({ url: `/var/courts/${id}/cancel`, method: "POST", body: {} }),
      invalidatesTags: ["VarCourts"],
    }),
    testVarCourt: builder.mutation({
      query: ({ id, startSec }) => ({ url: `/var/courts/${id}/test`, method: "POST", body: Number.isFinite(startSec) ? { startSec } : {} }),
      invalidatesTags: ["VarCourts"],
    }),
    getVarChallenge: builder.query({
      query: (id) => `/var/challenges/${id}`,
    }),
  }),
});

export const {
  useGetVarCourtsQuery,
  useCreateVarCourtMutation,
  useUpdateVarCourtMutation,
  useDeleteVarCourtMutation,
  useCancelVarCourtMutation,
  useTestVarCourtMutation,
  useGetVarChallengeQuery,
} = varCourtAdminApiSlice;
