import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const vendorApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Vendor endpoints
    getVendors: builder.query({
      query: () => ({
        url: `/superadmin/vendor-list/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["Vendor", "Company"],
    }),

    getVendorById: builder.query({
      query: (id: number) => ({
        url: `/superadmin/vendor-list/${id}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["Vendor"],
    }),

    getVendorsByStatus: builder.query({
      query: (status: string) => ({
        url: `/superadmin/vendor-list/by-status?status=${status}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["Vendor"],
    }),

    createVendor: builder.mutation({
      query: (data: { 
        companyId?: number | null;
        category: string;
        contactPerson: string;
        contactPersonPhoneNumber?: string;
        email: string;
        status?: string;
      }) => ({
        url: `/superadmin/vendor-list/create`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Vendor","Company"],
    }),

    updateVendor: builder.mutation({
      query: ({ id, ...data }: { 
        id: number;
        companyId?: number | null;
        category: string;
        contactPerson: string;
        contactPersonPhoneNumber?: string;
        email: string;
        status?: string;
      }) => ({
        url: `/superadmin/vendor-list/update`,
        method: "POST",
        body: { ...data, id },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Vendor"],
    }),

    updateVendorStatus: builder.mutation({
      query: ({ id, status }: { id: number; status: string }) => ({
        url: `/superadmin/vendor-list/change-vendor-status`,
        method: "POST",
        body: { id, status },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Vendor"],
    }),

    shareVendor: builder.mutation({
      query: (data:any) => ({
        url: `/superadmin/vendor-list/share-vendor`,
        method: "POST",
        body: data ,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Vendor"],
    }),

    deleteVendor: builder.mutation({
      query: (id: number) => ({
        url: `/superadmin/vendor-list/${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Vendor"],
    }),

    deleteMultipleVendors: builder.mutation({
      query: (data: { ids: number[] }) => ({
        url: `/superadmin/vendor-list/delete-multiple`,
        method: "DELETE",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Vendor"],
    }),

    // Company endpoints
    getCompanies: builder.query({
      query: () => ({
        url: `/superadmin/company-list/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["Company"],
    }),

    getCompanyById: builder.query({
      query: (id: number) => ({
        url: `/superadmin/company-list/${id}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["Company"],
    }),

    createCompany: builder.mutation({
      query: (data: { 
        companyName: string;
        companyWebsite?: string;
        companyPhoneNumber?: string;
        companyEmail: string;
      }) => ({
        url: `/superadmin/company-list/create`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Company"],
    }),

    updateCompany: builder.mutation({
      query: ({ id, ...data }: { 
        id: number;
        companyName: string;
        companyWebsite?: string;
        companyPhoneNumber?: string;
        companyEmail: string;
      }) => ({
        url: `/superadmin/company-list/update`,
        method: "POST",
        body: { ...data, id },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Company"],
    }),

    deleteCompany: builder.mutation({
      query: (id: number) => ({
        url: `/superadmin/company-list/${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Company"],
    }),

    deleteMultipleCompanies: builder.mutation({
      query: (data: { ids: number[] }) => ({
        url: `/superadmin/company-list/delete-multiple`,
        method: "DELETE",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Company"],
    }),
  }),
});

export const {
  // Vendor hooks
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useGetVendorsByStatusQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useUpdateVendorStatusMutation,
  useShareVendorMutation,
  useDeleteVendorMutation,
  useDeleteMultipleVendorsMutation,
  
  // Company hooks
  useGetCompaniesQuery,
  useGetCompanyByIdQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useDeleteMultipleCompaniesMutation,
} = vendorApi;