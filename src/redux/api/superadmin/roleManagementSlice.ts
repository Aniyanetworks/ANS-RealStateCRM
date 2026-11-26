import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";


const roleApi = api.injectEndpoints({
    endpoints: (builder) => ({
      createRole: builder.mutation({
        query: (data) => ({
          url: '/superadmin/role-management/create',
          method: 'POST',
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        }),
        invalidatesTags: ['RoleListTag'],
      }),
  
      updateRole: builder.mutation({
        query: ({ data, uuid }: { data: any; uuid: string }) => ({
          url: `/superadmin/role-management/update?uuid=${uuid}`,
          method: 'POST',
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        }),
        invalidatesTags: ['RoleListTag', 'SingleRoleTag'],
      }),
  
      getRoleList: builder.query({
        query: () => ({
          url: '/superadmin/role-management/get',
          method: 'GET',
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        }),
        providesTags: ['RoleListTag'],
      }),
  
      getSingleRole: builder.query({
        query: (uuid: string) => ({
          url: `/superadmin/role-management/get-spacific?uuid=${uuid}`,
          method: 'GET',
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        }),
        providesTags: ['SingleRoleTag'],
      }),
  
      deleteRole: builder.mutation({
        query: (uuid: string) => ({
          url: `/superadmin/role-management/delete?uuid=${uuid}`,
          method: 'DELETE',
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        }),
        invalidatesTags: ['RoleListTag'],
      }),
  
      deleteMultipleRoles: builder.mutation({
        query: (uuids: string[]) => ({
          url: '/superadmin/role-management/delete-multiple',
          method: 'DELETE',
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
          body: { uuids },
        }),
        invalidatesTags: ['RoleListTag'],
      }),
    }),
  });
  
  export const {
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useGetRoleListQuery,
    useGetSingleRoleQuery,
    useDeleteRoleMutation,
    useDeleteMultipleRolesMutation,
  } = roleApi;
