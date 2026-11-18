// src/slices/faceDataApiSlice.js — dữ liệu "Tra cứu ảnh VĐV" (SportConnect, PickleballVN): kéo dữ liệu / reindex
import { apiSlice } from "./apiSlice";

export const faceDataApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFaceSources: builder.query({
      query: () => "/admin/spc-face/sources",
      providesTags: ["FaceSources"],
    }),
    runFaceSource: builder.mutation({
      query: ({ source, mode }) => ({ url: `/admin/spc-face/sources/${source}/run`, method: "POST", body: { mode } }),
      invalidatesTags: ["FaceSources"],
    }),
  }),
});

export const { useGetFaceSourcesQuery, useRunFaceSourceMutation } = faceDataApiSlice;
