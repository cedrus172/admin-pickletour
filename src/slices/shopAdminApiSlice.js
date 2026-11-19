// src/slices/shopAdminApiSlice.js — Gian hàng độc quyền GOATWIN: chế độ hiển thị, người quản lý, thông tin gian hàng
import { apiSlice } from "./apiSlice";

export const shopAdminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getShopConfig: builder.query({
      query: () => "/admin/shop/config",
      providesTags: ["ShopConfig"],
    }),
    saveShopConfig: builder.mutation({
      query: (body) => ({ url: "/admin/shop/config", method: "PUT", body }),
      invalidatesTags: ["ShopConfig"],
    }),
  }),
});

export const { useGetShopConfigQuery, useSaveShopConfigMutation } = shopAdminApiSlice;
