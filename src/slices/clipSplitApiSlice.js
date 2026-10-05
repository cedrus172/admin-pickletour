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
    // Tất cả job (mọi giải), đang chạy lên đầu.
    clipSplitJobs: builder.query({
      query: () => ({ url: "/admin/clip-split/jobs" }),
    }),
    // Migrate recordings Drive → Telegram (theo giải).
    migratePlan: builder.query({
      query: ({ tournamentId }) => ({
        url: `/admin/tournaments/${tournamentId}/drive-migrate/plan`,
      }),
    }),
    startMigrate: builder.mutation({
      query: ({ tournamentId }) => ({
        url: `/admin/tournaments/${tournamentId}/drive-migrate/start`,
        method: "POST",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLazyClipSplitPlanQuery,
  useStartClipSplitMutation,
  useLazyClipSplitStatusQuery,
  useClipSplitJobsQuery,
  useLazyMigratePlanQuery,
  useStartMigrateMutation,
} = clipSplitApiSlice;
