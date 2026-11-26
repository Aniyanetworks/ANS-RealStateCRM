import { getEnvUrls } from '../../utils/constant';
import { api } from './apiSlice';

const systemLogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSystemLogs: builder.query<{ logs: string; total: number }, { type?: string; lines?: number }>({
      query: ({ type = 'combined', lines = 200 } = {}) => ({
        url: `/system-logs?type=${type}&lines=${lines}`,
        method: 'GET',
      }),
    }),
    clearSystemLogs: builder.mutation<{ status: boolean; message: string }, { type?: string }>({
      query: ({ type = 'combined' } = {}) => ({
        url: `/system-logs?type=${type}`,
        method: 'DELETE',
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
    }),
  }),
});

export const { useGetSystemLogsQuery, useClearSystemLogsMutation } = systemLogApi;
