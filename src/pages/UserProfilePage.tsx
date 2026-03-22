import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/HomeLayout";
import { useStore } from "../zustand/store";
import { apiClient } from "../untils/apiClient";

const UserProfilePage: React.FC = () => {
  const { user, setUser, showNotification } = useStore((state) => state);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phoneNumber: user?.phoneNumber ? String(user.phoneNumber) : "",
    address: user?.address || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phoneNumber: user.phoneNumber ? String(user.phoneNumber) : "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    const key = id === "full_name" ? "name" : id === "phone" ? "phoneNumber" : id;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {};
    if (formData.name !== (user?.name || "")) payload.name = formData.name;

    const userPhoneStr = user?.phoneNumber ? String(user.phoneNumber) : "";
    if (formData.phoneNumber !== userPhoneStr) {
      payload.phoneNumber = formData.phoneNumber ? Number(formData.phoneNumber) : 0;
    }

    if (formData.address !== (user?.address || ""))
      payload.address = formData.address;

    if (Object.keys(payload).length === 0) {
      showNotification("Không có thông tin nào được thay đổi.");
      return;
    }

    try {
      // Assuming your endpoint is PUT /user/profile.
      // Adjust the URL if your backend uses a different endpoint for profile updates.
      await apiClient.put("/user/profile", payload);

      if (user) {
        setUser({ ...user, ...payload });
      }
      showNotification("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật thông tin:", error);
      showNotification("Cập nhật thất bại. Vui lòng thử lại.");
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
                Edit Profile
              </h1>
              <p className="text-gray-600">
                Update your personal information and delivery preferences.
              </p>
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
                    <span className="material-symbols-outlined text-sm" data-icon="edit">
                      photo_camera
                    </span>
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-lg text-gray-900">Your Profile Picture</h3>
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
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-gray-700"
                    htmlFor="full_name"
                  >
                    Full Name
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm outline-none text-gray-800"
                    id="full_name"
                    placeholder="Enter your full name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-gray-700"
                      htmlFor="phone"
                    >
                      Phone Number
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm outline-none text-gray-800"
                      id="phone"
                      placeholder="+1 (000) 000-0000"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                  {/* Email Address (Read Only) */}
                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-gray-700"
                      htmlFor="email"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed shadow-none outline-none"
                        id="email"
                        placeholder="email@example.com"
                        readOnly
                        type="email"
                        defaultValue={user?.email}
                      />
                      <span className="absolute right-3 top-3 material-symbols-outlined text-gray-400 text-sm" data-icon="lock">
                        lock
                      </span>
                    </div>
                  </div>
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
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm resize-none outline-none text-gray-800"
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
                    className="w-full sm:w-auto px-10 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 hover:shadow-lg active:scale-95 transition-all outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    type="submit"
                  >
                    Save Changes
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

export default UserProfilePage;
