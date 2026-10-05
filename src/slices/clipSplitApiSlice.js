// Cắt clip YouTube "xuyên suốt" → VOD riêng từng trận → Google Drive.
import { apiSlice } from "./apiSlice";

export const clipSplitApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Xem trước: sẽ cắt những trận nào.
    clipSplitPlan: builder.query({
      query: ({ tournamentId, force = false }) => ({
        url: `/admin/tournaments/${tournamentId}/clip-split/plan${
          force ? "?force=1" : ""
        }`,
      }),
    }),
    // Bắt đầu cắt (không matchIds = cả giải; có matchIds = chỉ các trận đó).
    startClipSplit: builder.mutation({
      query: ({ tournamentId, matchIds = null, force = false }) => ({
        url: `/admin/tournaments/${tournamentId}/clip-split/start`,
        method: "POST",
        body: { matchIds, force },
      }),
    }),
    // Tiến độ job.
    clipSplitStatus: builder.query({
      query: ({ tournamentId }) => ({
        url: `/admin/tournaments/${tournamentId}/clip-split/status`,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLazyClipSplitPlanQuery,
  useStartClipSplitMutation,
  useLazyClipSplitStatusQuery,
} = clipSplitApiSlice;
