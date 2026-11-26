import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";


const permissionApi = api.injectEndpoints({
    endpoints: (builder) => ({
      createPermission: builder.mutation({
        query: (data) => ({
          url: '/superadmin/permission-management/create',
          method: 'POST',
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        }),
        invalidatesTags: ['PermissionListTag','SingleRoleTag','RoleListTag'],
      }),
  
      getPermissionList: builder.query({
        query: (uuid: string) => ({
          url: `/superadmin/permission-management/get?uuid=${uuid}`,
          method: 'GET',
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        }),
        providesTags: ['PermissionListTag'],
      }),
  
    }),
  });
  
  export const {
    useCreatePermissionMutation,
    useGetPermissionListQuery
  } = permissionApi;
