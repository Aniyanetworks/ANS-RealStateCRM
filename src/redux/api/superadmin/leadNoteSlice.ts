import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

interface LeadNote {
  uuid: string;
  slug: string;
  note: string;
  leadId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
  };
  owner?: {
    id: number;
    name: string;
  };
}

interface LeadNoteResponse {
  status: boolean;
  data: {
    NoteData: LeadNote[];
  };
  message: string;
}

const LeadNoteApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeadNote: builder.query<LeadNoteResponse, { leadId: string }>({
      query: ({ leadId }) => {
        if (!leadId) throw new Error("Lead ID is required");
        return {
          url: `/superadmin/leads-note/list?leadId=${leadId}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getLeadNoteTag"],
    }),

    createUpdateLeadNote: builder.mutation<
      { status: boolean; message: string; data: { NoteData: LeadNote } },
      { uuid: string | null; data: { note: string; leadId: number } }
    >({
      query: ({ uuid, data }) => ({
        url: `/superadmin/leads-note/create-and-update?uuid=${uuid || 'null'}`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getLeadNoteTag"],
    }),

    deleteLeadNote: builder.mutation<
      { status: boolean; message: string },
      string
    >({
      query: (uuid) => ({
        url: `/superadmin/leads-note/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getLeadNoteTag"],
    }),

    deleteLeadNoteMultiple: builder.mutation<
      { status: boolean; message: string },
      string[]
    >({
      query: (uuids) => ({
        url: `/superadmin/leads-note/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids }
      }),
      invalidatesTags: ["getLeadNoteTag"],
    }),
  }),
});

export const {
  useGetLeadNoteQuery,
  useCreateUpdateLeadNoteMutation,
  useDeleteLeadNoteMutation,
  useDeleteLeadNoteMultipleMutation
} = LeadNoteApi; 