const BASE_URL = "https://localhost:7027";
import axios from "axios";
export class ApiError extends Error {
    status: number;
    data: object | undefined;

    constructor(status: number, message: string, data?: object) {
        super(message);
        this.status = status;
        this.data = data;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status: number = error.response ? error.response.status : null;
    if (status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes("/refresh-token")) {
        return Promise.reject(status);
      }
      originalRequest._retry = true;
      try {
        const response = await axiosInstance.post(`${BASE_URL}/refresh-token`);

        const { accessToken: newAccessToken } = response.data;
        localStorage.setItem("accessToken", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Lỗi không xác định";
      return Promise.reject(new ApiError(status, message, error.response.data));
    } else if (error.request) {
      return Promise.reject(new ApiError(0, "Không thể kết nối đến máy chủ."));
    } else {
      return Promise.reject(new Error(error.message));
    }
  },
);

export const apiClient = {
  get: <T>(url: string) => axiosInstance.get<T>(url).then((res) => res.data),
  post: <T>(url: string, data: object = {}) =>
    axiosInstance.post<T>(url, data).then((res) => res.data),
  put: <T>(url: string, data: object) =>
    axiosInstance.put<T>(url, data).then((res) => res.data),
  delete: <T>(url: string, data: object) =>
    axiosInstance.delete<T>(url, data).then((res) => res.data),
  patch: <T>(url: string, data: object) =>
    axiosInstance.patch<T>(url, data).then((res) => res.data),

  postForm: <T>(url: string, data: FormData) =>
    axiosInstance.post<T>(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  getFile: (url: string) =>
    axiosInstance.get(url, { responseType: "blob" }).then((res) => res.data),
  postnodata: <T>(url: string, data: object = {}) =>
    axiosInstance.post<T>(url, data),
  patchForm: <T>(url: string, data: FormData) =>
    axiosInstance.patch<T>(url, data),
  patchFormdata: <T>(url: string, data: FormData) =>
    axiosInstance.patch<T>(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};
