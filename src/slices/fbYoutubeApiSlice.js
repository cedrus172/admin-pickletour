import { apiSlice } from "./apiSlice";

// Tải VOD live fanpage Facebook → upload YouTube (bấm tay).
export const fbYoutubeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    fbytPages: builder.query({
      query: () => `/admin/fb-youtube/pages`,
      keepUnusedDataFor: 30,
    }),
    fbytLives: builder.query({
      query: ({ pageId, limit = 25 }) =>
        `/admin/fb-youtube/pages/${encodeURIComponent(pageId)}/lives?limit=${limit}`,
      keepUnusedDataFor: 0,
      providesTags: ["FbYtLives"],
    }),
    fbytJobs: builder.query({
      query: ({ pageId } = {}) =>
        `/admin/fb-youtube/jobs${pageId ? `?pageId=${encodeURIComponent(pageId)}` : ""}`,
      keepUnusedDataFor: 0,
      providesTags: ["FbYtJobs"],
    }),
    fbytUpload: builder.mutation({
      query: (body) => ({ url: `/admin/fb-youtube/upload`, method: "POST", body }),
      invalidatesTags: ["FbYtJobs", "FbYtLives"],
    }),
    fbytRetry: builder.mutation({
      query: (id) => ({ url: `/admin/fb-youtube/jobs/${id}/retry`, method: "POST" }),
      invalidatesTags: ["FbYtJobs"],
    }),
    fbytUpdateMeta: builder.mutation({
      query: ({ id, title, description }) => ({
        url: `/admin/fb-youtube/jobs/${id}/meta`,
        method: "PATCH",
        body: { title, description },
      }),
      invalidatesTags: ["FbYtJobs"],
    }),
  }),
});

export const {
  useFbytPagesQuery,
  useFbytLivesQuery,
  useFbytJobsQuery,
  useFbytUploadMutation,
  useFbytRetryMutation,
  useFbytUpdateMetaMutation,
} = fbYoutubeApiSlice;
