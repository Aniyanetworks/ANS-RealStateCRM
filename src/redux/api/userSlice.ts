import { getEnvUrls } from '../../utils/constant';
import { api } from './apiSlice';

const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    userRegistration: builder.mutation({
      query: (data) => ({
        url: "/auth/registration",
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

    userLogin: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

    resendOtp: builder.mutation({
      query: (body) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body,
        credentials: 'include',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    resetUserAuthenticator: builder.mutation({
      query: (body) => ({
        url: '/auth/reset-authenticator',
        method: 'POST',
        body,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    toggleSmsOtp: builder.mutation({
      query: (body) => ({
        url: '/auth/sms-otp/toggle',
        method: 'POST',
        body,
        credentials: 'include',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    setupAppAuthenticator: builder.mutation({
      query: (data) => ({
        url: "/auth/setup-app-authenticator",
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

    verificationAppAuthenticatorCode: builder.mutation({
      query: (data) => ({
        url: "/auth/verification-app-authenticator-code",
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

    userLogout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    userProfileUpdate: builder.mutation({
      query: (data) => ({
        url: `/auth/update-profile`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    updateBasicInfo: builder.mutation({
      query: (data) => ({
        url: `/auth/update-basic-info`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    updatePersonalInfo: builder.mutation({
      query: (data) => ({
        url: `/auth/update-personal-info`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    updateContactInfo: builder.mutation({
      query: (data) => ({
        url: `/auth/update-contact-info`,
        method: "PUT",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    validateAgent: builder.mutation({
      query: (id) => ({
        url: `/auth/validate-agent?agentId=${id}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    updatePassword: builder.mutation({
      query: (data) => ({
        url: `/auth/update-password`,
        method: "PUT",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    updateSignature: builder.mutation({
      query: (data) => ({
        url: `/auth/update-signature`,
        method: "PUT",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    forgotPassword: builder.mutation({
      query: (data) => ({
        url: `/auth/forgot-password`,
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ data, token }: { data: { password: string }; token?: string }) => {
        return {
          url: `/auth/reset-password?token=${token}`,
          method: "POST",
          body: data,
        };
      },
    }),

    sendCode: builder.mutation({
      query: (data) => ({
        url: `/auth/send-code`,
        method: "POST",
        body: data,
      }),
    }),

    verifyCode: builder.mutation({
      query: (data) => ({
        url: `/auth/verify-code`,
        method: "POST",
        body: data,
      }),
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: `/auth/change-password`,
        method: "POST",
        body: data,
      }),
    }),

    impersonate: builder.mutation({
      query: (data) => ({
        url: "/auth/impersonate",
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        credentials: "include",
      }),
    }),

    toggleUserStatus: builder.mutation({
      query: (body: { userId: string; isActive: boolean }) => ({
        url: '/auth/toggle-status',
        method: 'POST',
        body,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        credentials: "include",
      })
    }),
  }),
});

export const {
  useUserRegistrationMutation,
  useUserLoginMutation,
  useResendOtpMutation,
  useToggleSmsOtpMutation,
  useUserLogoutMutation,
  useUserProfileUpdateMutation,
  useUpdateBasicInfoMutation,
  useUpdatePersonalInfoMutation,
  useUpdateContactInfoMutation,
  useUpdatePasswordMutation,
  useUpdateSignatureMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyCodeMutation,
  useSendCodeMutation,
  useChangePasswordMutation,
  useValidateAgentMutation,
  useSetupAppAuthenticatorMutation,
  useVerificationAppAuthenticatorCodeMutation,
  useImpersonateMutation,
  useToggleUserStatusMutation,
  useResetUserAuthenticatorMutation,
} = userApi;
