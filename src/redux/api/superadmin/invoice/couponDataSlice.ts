import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const couponDataApi = api.injectEndpoints({
  endpoints: (builder) => ({   


    getCoupon: builder.query({
      query: () => {
        return {
          url: `/superadmin/coupons/list`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getCouponTag"],
    }),

    getValidatedCoupon: builder.mutation({
      query: ({ coupon_code, product_ids }: { coupon_code: string; product_ids?: string[]; }) => {
        const params = new URLSearchParams();
        params.append("coupon_code", coupon_code);
        if (product_ids && product_ids.length > 0) {
          product_ids.forEach((id) => params.append("product_ids", id));
        }
        return {
          url: `/superadmin/coupons/validate-coupon?${params.toString()}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getCouponTag"],
    }),
    

    createUpdateCoupon: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/coupons/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getCouponTag"],
    }),

    deleteCoupon: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/coupons/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getCouponTag"],
    }),

    deleteCouponMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/coupons/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getCouponTag"],
    }),
  }),
});

export const {
  useGetCouponQuery,
  useGetValidatedCouponMutation,
  useCreateUpdateCouponMutation,
  useDeleteCouponMutation,
  useDeleteCouponMultipleMutation
} = couponDataApi;