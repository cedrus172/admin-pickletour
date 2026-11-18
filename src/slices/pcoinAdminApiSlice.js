// src/slices/pcoinAdminApiSlice.js — admin nạp / trừ / quản lý số dư PCoin
import { apiSlice } from "./apiSlice";

export const pcoinAdminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPcoinSummary: builder.query({
      query: () => "/admin/pcoin/summary",
      providesTags: [{ type: "Pcoin", id: "SUMMARY" }],
    }),
    getPcoinUsers: builder.query({
      query: (params = {}) => ({ url: "/admin/pcoin/users", params }),
      providesTags: [{ type: "Pcoin", id: "USERS" }],
    }),
    getPcoinTransactions: builder.query({
      query: (params = {}) => ({ url: "/admin/pcoin/transactions", params }),
      providesTags: [{ type: "Pcoin", id: "TX" }],
    }),
    adjustPcoin: builder.mutation({
      query: ({ id, amount, note }) => ({
        url: `/admin/pcoin/users/${id}/adjust`,
        method: "POST",
        body: { amount, note },
      }),
      invalidatesTags: ["Pcoin", "User"],
    }),
    setPcoinPrices: builder.mutation({
      query: (body) => ({ url: "/admin/pcoin/prices", method: "PUT", body }),
      invalidatesTags: [{ type: "Pcoin", id: "SUMMARY" }],
    }),
  }),
});

export const {
  useGetPcoinSummaryQuery,
  useGetPcoinUsersQuery,
  useGetPcoinTransactionsQuery,
  useAdjustPcoinMutation,
  useSetPcoinPricesMutation,
} = pcoinAdminApiSlice;
