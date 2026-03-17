import { apiClient } from "./apiClient";
export const getToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const isLoggedIn = (): boolean => {
  const token = getToken();
  return !!token;
};

export const logout = async () => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    console.error("Lỗi khi gọi API logout:", error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

