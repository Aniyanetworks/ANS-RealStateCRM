import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const discountManagementApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createDiscount: builder.mutation({
            query: (data) => {
                return {
                    url: `/superadmin/discount-management/create`,
                    method: "POST",
                    body: data,
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            invalidatesTags: [
                "getDiscountListDataTag",
                "getSingleDiscountDataTag",
            ],
        }),

        updateDiscount: builder.mutation({
            query: ({ data, uuid }: { data: any; uuid?: string }) => {
                const queryParams = new URLSearchParams();
                if (uuid) queryParams.append("uuid", uuid);
                return {
                    url: `/superadmin/discount-management/update?${queryParams.toString()}`,
                    method: "POST",
                    body: data,
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            invalidatesTags: [
                "getDiscountListDataTag",
                "getSingleDiscountDataTag",
            ],
        }),

        getDiscountListData: builder.query({
            query: () => ({
                url: `/superadmin/discount-management/list`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["getDiscountListDataTag"],
        }),

        getSingleDiscountData: builder.query({
            query: (uuid) => ({
                url: `/superadmin/discount-management/get-single-discount?uuid=${uuid}`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["getSingleDiscountDataTag"],
        }),

        deleteSingleDiscount: builder.mutation({
            query: (id) => ({
                url: `/superadmin/discount-management/delete?id=${id}`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["getDiscountListDataTag"],
        }),
    }),
});

export const {
    useCreateDiscountMutation,
    useUpdateDiscountMutation,
    useGetDiscountListDataQuery,
    useGetSingleDiscountDataQuery,
    useDeleteSingleDiscountMutation,
} = discountManagementApi;