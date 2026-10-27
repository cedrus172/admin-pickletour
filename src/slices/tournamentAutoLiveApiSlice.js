import { apiSlice } from "./apiSlice";

export const tournamentAutoLiveApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listAutoLiveSessions: builder.query({
      query: ({ tournamentId, status } = {}) => {
        const p = new URLSearchParams();
        if (tournamentId) p.set("tournamentId", tournamentId);
        if (status) p.set("status", status);
        return { url: `/tournament-auto-live/sessions?${p.toString()}` };
      },
      providesTags: ["AutoLive"],
    }),
    startAutoLive: builder.mutation({
      query: (body) => ({ url: `/tournament-auto-live/start`, method: "POST", body }),
      invalidatesTags: ["AutoLive"],
    }),
    stopAutoLive: builder.mutation({
      query: (id) => ({ url: `/tournament-auto-live/${id}/stop`, method: "POST" }),
      invalidatesTags: ["AutoLive"],
    }),
    // Chỉnh độ trễ overlay RIÊNG của phiên khi đang live (ms; null = về mặc định chung).
    setOverlayDelay: builder.mutation({
      query: ({ id, ms }) => ({ url: `/tournament-auto-live/${id}/overlay-delay`, method: "PATCH", body: { ms } }),
      invalidatesTags: ["AutoLive"],
    }),
    // Court + cam Imou cho giải đấu (reuse endpoint từ live-app để lấy court +
    // metadata, backend đã có sẵn cho native-live-app).
    listTournamentCourtsForAutoLive: builder.query({
      query: (tournamentId) => `/live-app/tournaments/${tournamentId}/courts?includeImou=1`,
    }),
    listAdminFbPages: builder.query({
      query: () => `/live-app/facebook-pages`,
    }),
    listAvailableCams: builder.query({
      query: () => `/tournament-auto-live/available-cams`,
    }),
    getAutoLiveStats: builder.query({
      query: () => `/tournament-auto-live/stats`,
    }),
    // Đầu thu Dahua/DMSS qua P2P (nguồn auto-live). Trạng thái (KHÔNG trả mật khẩu).
    getVenueDahua: builder.query({
      query: (venueId) => `/tournament-auto-live/venue-dahua?venueId=${venueId}`,
      providesTags: (r, e, venueId) => [{ type: "VenueDahua", id: venueId }],
    }),
    setVenueDahua: builder.mutation({
      query: (body) => ({ url: `/tournament-auto-live/venue-dahua`, method: "POST", body }),
      invalidatesTags: (r, e, { venueId }) => [{ type: "VenueDahua", id: venueId }],
    }),
    // Thư viện nguồn RTSP có tên (label + url + vị trí overlay).
    listRtspSources: builder.query({
      query: () => `/tournament-auto-live/rtsp-sources`,
    }),
    createRtspSource: builder.mutation({
      query: (body) => ({ url: `/tournament-auto-live/rtsp-sources`, method: "POST", body }),
    }),
    updateRtspSource: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/tournament-auto-live/rtsp-sources/${id}`, method: "PUT", body }),
    }),
    deleteRtspSource: builder.mutation({
      query: (id) => ({ url: `/tournament-auto-live/rtsp-sources/${id}`, method: "DELETE" }),
    }),
    // Test kết nối nhiều nguồn RTSP cùng lúc (ffprobe phía server).
    testRtspSources: builder.mutation({
      query: (body) => ({ url: `/tournament-auto-live/rtsp-sources/test`, method: "POST", body }),
    }),
    // Đổi hàng loạt user/pass/ip/port cho nhiều nguồn, giữ channel.
    bulkUpdateRtspCredentials: builder.mutation({
      query: (body) => ({
        url: `/tournament-auto-live/rtsp-sources/bulk-credentials`,
        method: "POST",
        body,
      }),
    }),
    // Danh sách sân của giải KÈM tên cụm (clusterName) — để gán sân cho luồng live.
    getTournamentCourtsForLive: builder.query({
      query: (tid) => `/tournament-auto-live/tournaments/${tid}/courts`,
      keepUnusedDataFor: 30,
    }),
    // Clip từng trận (recording auto-live) — giám sát trạng thái + link Drive.
    listAutoLiveClips: builder.query({
      query: ({ tournamentId, sessionId, status } = {}) => {
        const p = new URLSearchParams();
        if (tournamentId) p.set("tournamentId", tournamentId);
        if (sessionId) p.set("sessionId", sessionId);
        if (status) p.set("status", status);
        return { url: `/tournament-auto-live/clips?${p.toString()}` };
      },
      providesTags: ["AutoLiveClip"],
    }),
  }),
});

export const {
  useListAutoLiveSessionsQuery,
  useStartAutoLiveMutation,
  useStopAutoLiveMutation,
  useSetOverlayDelayMutation,
  useListTournamentCourtsForAutoLiveQuery,
  useGetTournamentCourtsForLiveQuery,
  useListAdminFbPagesQuery,
  useListAvailableCamsQuery,
  useGetAutoLiveStatsQuery,
  useGetVenueDahuaQuery,
  useSetVenueDahuaMutation,
  useListRtspSourcesQuery,
  useCreateRtspSourceMutation,
  useUpdateRtspSourceMutation,
  useDeleteRtspSourceMutation,
  useTestRtspSourcesMutation,
  useBulkUpdateRtspCredentialsMutation,
  useListAutoLiveClipsQuery,
} = tournamentAutoLiveApiSlice;
