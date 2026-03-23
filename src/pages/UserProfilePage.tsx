import React, { useState } from "react";
import DashboardLayout from "../layouts/HomeLayout";
import { useStore } from "../zustand/store";
import { apiClient } from "../untils/apiClient";
import type { UserProfilePrivate } from "../interfaces/customer";

type ProfileFormData = {
  name: string;
  phoneNumber: string;
  address: string;
};

const buildFormDataFromUser = (
  profile: UserProfilePrivate | null,
): ProfileFormData => ({
  name: profile?.name || "",
  phoneNumber: profile?.phoneNumber ? String(profile.phoneNumber) : "",
  address: profile?.address || "",
});

const UserProfilePage: React.FC = () => {
  const { user, setUser, showNotification } = useStore((state) => state);

  const [formDrafts, setFormDrafts] = useState<Record<number, ProfileFormData>>(
    {},
  );

  const formData = user
    ? (formDrafts[user.id] ?? buildFormDataFromUser(user))
    : buildFormDataFromUser(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!user) return;

    const { id, value } = e.target;
    const key =
      id === "full_name" ? "name" : id === "phone" ? "phoneNumber" : id;

    if (key !== "name" && key !== "phoneNumber" && key !== "address") return;

    setFormDrafts((prev) => ({
      ...prev,
      [user.id]: {
        ...formData,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showNotification("Không tìm thấy thông tin người dùng.", "error");
      return;
    }

    const payload: Partial<
      Pick<UserProfilePrivate, "name" | "phoneNumber" | "address">
    > = {};

    if (formData.name !== (user.name || "")) payload.name = formData.name;

    const userPhoneStr = user.phoneNumber ? String(user.phoneNumber) : "";
    if (formData.phoneNumber !== userPhoneStr) {
      payload.phoneNumber = formData.phoneNumber.trim();
    }

    if (formData.address !== (user.address || ""))
      payload.address = formData.address;

    if (Object.keys(payload).length === 0) {
      showNotification("Không có thông tin nào được thay đổi.", "error");
      return;
    }

    try {
      // payload.address
      await apiClient.put("/customer/profile", payload);
      const updatedUser = { ...user, ...payload };
      setUser(updatedUser);
      setFormDrafts((prev) => ({
        ...prev,
        [user.id]: buildFormDataFromUser(updatedUser),
      }));
      showNotification("Cập nhật thông tin thành công!", "success");
    } catch (error) {
      console.error("Lỗi cập nhật thông tin:", error);
      showNotification("Cập nhật thất bại. Vui lòng thử lại.", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col max-w-7xl mx-auto w-full">
        {/* Main Content Area */}
        <section className="flex-1">
          <div className="max-w-2xl bg-white p-6 md:p-8 rounded-xl mx-auto">
            <header className="mb-12">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                Thông Tin Cá Nhân
              </h1>
            </header>
            {/* Profile Form */}
            <div className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0 mb-12">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-sm">
                    <img
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                      src={user?.avatarUrl}
                    />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-orange-600 text-white p-1.5 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-sm"
                      data-icon="edit"
                    >
                      photo_camera
                    </span>
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-lg text-gray-900">
                    Your Profile Picture
                  </h3>
                  <a
                    className="inline-block mt-2 text-xs font-bold uppercase tracking-wider text-orange-600 hover:underline transition-all duration-200"
                    href="#"
                    onClick={(e) => e.preventDefault()}
                  >
                    Change Photograph
                  </a>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Full Name */}
                <Input
                  label="Full Name"
                  id="full_name"
                  placeholder="Enter your full name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone Number */}
                  <Input
                    label="Phone Number"
                    id="phone"
                    placeholder="Enter your phone number"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                  {/* Email Address (Read Only) */}
                  <Input
                    label="Email Address"
                    id="email"
                    placeholder="Enter your email address"
                    type="email"
                    value={user?.email || ""}
                    onChange={() => {}}
                  />
                </div>
                {/* Primary Delivery Address */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-gray-700"
                    htmlFor="address"
                  >
                    Primary Delivery Address
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none outline-none "
                    id="address"
                    placeholder="123 Editorial Way, Suite 400, New York, NY 10001"
                    rows={4}
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                {/* Form Actions */}
                <div className="pt-8 flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
                  <button
                    className="w-full sm:w-auto px-10 py-3 bg-primary text-white font-bold rounded-lg hover:bg-blue-600"
                    type="submit"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};
const Input: React.FC<{
  label: string;
  id: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, id, placeholder, type, value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700" htmlFor={id}>
        {label}
      </label>
      <input
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none "
        id={id}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
export default UserProfilePage;
