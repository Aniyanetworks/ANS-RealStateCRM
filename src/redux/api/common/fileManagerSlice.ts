import { api } from "../apiSlice";
import { getEnvUrls } from "../../../utils/constant";

type ListParams = { parentId?: number | null };

export type FileNode = {
  id: number;
  ownerId: number;
  name: string;
  permissions: string[];
  parentId: number | null;
  isFolder: boolean;
  s3Key?: string | null;
  size?: number | null;
  mimeType?: string | null;
};

export type FileShare = {
  nodeId: number;
  sharedWithUserId: number;
  permissions: string[];
};

export const fileManagerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listNodes: builder.query<{ status: boolean; data: FileNode[] }, ListParams | void>({
      query: (params) => {
        const search = params && params.parentId !== undefined && params.parentId !== null
          ? `?parentId=${params.parentId}`
          : "";
        return {
          url: `/common/file-manager/list${search}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["FileManagerNodesTag"],
    }),   

    getAllFolders: builder.query<{ data: FileNode[] }, void>({
      query: () => ({
        url: `/common/file-manager/list-all`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["FileManagerSharedTag"],
    }),
    sharedWithMe: builder.query<{ status: boolean; data: FileNode[] }, void>({
      query: () => ({
        url: `/common/file-manager/shared-with-me`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["FileManagerSharedTag"],
    }),

    sharedChildren: builder.query<{ status: boolean; data: FileNode[] }, { parentId: number }>({
      query: ({ parentId }) => ({
        url: `/common/file-manager/shared-children?parentId=${parentId}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["FileManagerNodesTag"],
    }),

    createFolder: builder.mutation<{ status: boolean; data: FileNode }, { name: string; parentId?: number | null }>({
      query: ({ name, parentId }) => {
        const payload: { name: string; parentId?: number | null } = { name };
        if (parentId !== undefined && parentId !== null) payload.parentId = parentId;
        return {
          url: `/common/file-manager/folder`,
          method: "POST",
          body: payload,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["FileManagerNodesTag"],
    }),

    uploadFile: builder.mutation<{ status: boolean; data: FileNode[]; message: string; uploadedCount: number }, { files: File[]; parentId?: number | null }>({
      query: ({ files, parentId }) => {
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));
        if (parentId !== undefined && parentId !== null) {
          formData.append("parentId", String(parentId));
        }
        return {
          url: `/common/file-manager/upload`,
          method: "POST",
          body: formData,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["FileManagerNodesTag"],
    }),

    uploadSingleFile: builder.mutation<{ status: boolean; data: FileNode; message: string }, { file: File; parentId?: number | null }>({
      query: ({ file, parentId }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (parentId !== undefined && parentId !== null) {
          formData.append("parentId", String(parentId));
        }
        return {
          url: `/common/file-manager/upload-single`,
          method: "POST",
          body: formData,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["FileManagerNodesTag"],
    }),

    deleteNode: builder.mutation<{ status: boolean; message?: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/common/file-manager/${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerNodesTag", "FileManagerSharedTag"],
    }),

    deleteMultipleNodes: builder.mutation<{ status: boolean; message: string; deletedCount: number }, { nodeIds: number[] }>({
      query: (body) => ({
        url: `/common/file-manager/multiple-delete`,
        method: "DELETE",
        body,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerNodesTag", "FileManagerSharedTag"],
    }),

    moveNode: builder.mutation<{ status: boolean; data: FileNode }, { nodeId: number; newParentId?: number | null }>({
      query: (body) => ({
        url: `/common/file-manager/move`,
        method: "POST",
        body,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerNodesTag"],
    }),

    moveMultipleNodes: builder.mutation<{ status: boolean; data: FileNode[]; message: string; movedCount: number }, { nodeIds: number[]; newParentId?: number | null }>({
      query: (body) => ({
        url: `/common/file-manager/move-multiple`,
        method: "POST",
        body,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerNodesTag"],
    }),

    shareNode: builder.mutation<{ status: boolean; data: FileShare }, { nodeId: number; sharedWithUserId: number; permissions?: string[] }>({
      query: (body) => ({
        url: `/common/file-manager/share`,
        method: "POST",
        body: {
          ...body,
          permissions: body.permissions || ["view"]
        },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerSharedTag"],
    }),

    shareWithMultipleUsers: builder.mutation<{ status: boolean; data: FileShare[] }, { nodeId: number; users: Array<{ userId: number; permissions?: string[] }> }>({
      query: (body) => ({
        url: `/common/file-manager/share-multiple`,
        method: "POST",
        body: {
          ...body,
          users: body.users.map(user => ({
            ...user,
            permissions: user.permissions || ["view"]
          }))
        },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerSharedTag"],
    }),

    shareMultipleNodes: builder.mutation<{ status: boolean; data: FileShare[]; message: string; sharedCount: number }, { nodeIds: number[]; users: Array<{ userId: number; permissions?: string[] }> }>({
      query: (body) => ({
        url: `/common/file-manager/share-multiple-nodes`,
        method: "POST",
        body: {
          ...body,
          users: body.users.map(user => ({
            ...user,
            permissions: user.permissions || ["view"]
          }))
        },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerSharedTag"],
    }),

    giveMultiplePermissionsToUser: builder.mutation<{ status: boolean; data: FileShare[] }, { targetUserId: number; permissions: Array<{ nodeId: number; permissions?: string[] }> }>({
      query: (body) => ({
        url: `/common/file-manager/give-permissions`,
        method: "POST",
        body: {
          ...body,
          permissions: body.permissions.map(perm => ({
            ...perm,
            permissions: perm.permissions || ["view"]
          }))
        },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerSharedTag"],
    }),

    getDownloadUrl: builder.mutation<{ status: boolean; url: string }, { id: number }>({
      query: ({ id }) => ({
        url: `/common/file-manager/${id}/download-url`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    checkUserPermissions: builder.query<{ status: boolean; data: { permissions: string[]; isOwner: boolean; node?: FileNode } }, { nodeId: number }>({
      query: ({ nodeId }) => ({
        url: `/common/file-manager/${nodeId}/permissions`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    shareSingleNodeWithMultipleUsers: builder.mutation<{ status: boolean; data: FileShare[] }, { nodeId: number; users: Array<{ userId: number; permissions?: string[] }> }>({
      query: (body) => ({
        url: `/common/file-manager/share-single-node`,
        method: "POST",
        body: {
          ...body,
          users: body.users.map(user => ({
            ...user,
            permissions: user.permissions || ["view"]
          }))
        },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["FileManagerSharedTag"],
    }),

    renameNode: builder.mutation({
      query: ({ id, name }) => ({
        url: `/common/file-manager/rename/${id}`,
        method: 'PUT',
        body: { name },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ['FileManagerNodesTag'],
    }),

    searchNodes: builder.query({
      query: (params: { query: string; type?: string; limit?: number; offset?: number }) => ({
        url: '/common/file-manager/search',
        params,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['FileManagerNodesTag'],
    }),
    
    lazySearchNodes: builder.query({
      query: (params: { query: string; type?: string; limit?: number; offset?: number }) => ({
        url: '/common/file-manager/search',
        params,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

  }),
});

export const {
  useListNodesQuery,
  useGetAllFoldersQuery,
  useRenameNodeMutation,
  useSharedWithMeQuery,
  useSharedChildrenQuery,
  useCreateFolderMutation,
  useUploadFileMutation,
  useUploadSingleFileMutation,
  useShareSingleNodeWithMultipleUsersMutation,
  useDeleteNodeMutation,
  useDeleteMultipleNodesMutation,
  useMoveNodeMutation,
  useMoveMultipleNodesMutation,
  useShareNodeMutation,
  useShareWithMultipleUsersMutation,
  useShareMultipleNodesMutation,
  useGiveMultiplePermissionsToUserMutation,
  useGetDownloadUrlMutation,
  useCheckUserPermissionsQuery,
  useLazyCheckUserPermissionsQuery,
  useSearchNodesQuery,
  useLazySearchNodesQuery
} = fileManagerApi;