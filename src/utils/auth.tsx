// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
}

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;

  try {
    const decoded: DecodedToken = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};
