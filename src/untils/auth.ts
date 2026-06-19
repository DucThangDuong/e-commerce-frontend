import { apiClient, getCookie, removeCookie } from "./apiClient";
export const getToken = (): string | null => {
  return getCookie("accessToken") || null;
};

export const isLoggedIn = (): boolean => {
  const token = getToken();
  return !!token;
};

export const logout = async () => {
  try {
    await apiClient.post("/logout");
  } catch (error) {
    console.error("Lỗi khi gọi API logout:", error);
  } finally {
    removeCookie("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

