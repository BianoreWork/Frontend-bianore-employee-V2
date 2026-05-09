import { api } from '../lib/api';
import type {
  LoginResponse,
  OtpVerifyResponse,
  TwoFactorVerifyResponse,
  User,
} from '../types/api';

export const authService = {
  login: (email: string, password: string, deviceUid?: string) =>
    api.post<LoginResponse>('/auth/login', {
      email,
      password,
      device_uid: deviceUid,
      platform: 'web',
    }),

  verifyOtp: (otpToken: string, code: string) =>
    api.post<OtpVerifyResponse>('/auth/otp/verify', {
      otp_token: otpToken,
      code,
    }),

  resendOtp: (otpToken: string) =>
    api.post<{ message: string }>('/auth/otp/resend', { otp_token: otpToken }),

  verify2fa: (tempToken: string, code: string) =>
    api.post<TwoFactorVerifyResponse>('/auth/2fa/verify', {
      temp_token: tempToken,
      code,
    }),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  refresh: () => api.post<{ token: string; type: string }>('/auth/refresh'),

  me: () => api.get<User>('/auth/me'),
};
