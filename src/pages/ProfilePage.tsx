import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../zustand/store';
import { apiClient } from '../untils/apiClient';

const ProfilePage: React.FC = () => {
  const { user, setUser, showNotification } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'garage'>('profile');
  
  // Profile Edit State
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || ''
  });
  const [loading, setLoading] = useState(false);

  // Avatar Upload State
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (field: string) => {
    // Validate Phone
    if (field === 'phoneNumber' && editForm.phoneNumber && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(editForm.phoneNumber)) {
      showNotification('Số điện thoại không hợp lệ', 'error');
      return;
    }

    try {
      setLoading(true);
      let endpoint = '';
      let payload = {};

      if (field === 'name') {
        endpoint = '/customer/profile/name';
        payload = { name: editForm.name };
      } else if (field === 'phoneNumber') {
        endpoint = '/customer/profile/phone';
        payload = { phoneNumber: editForm.phoneNumber };
      } else if (field === 'address') {
        endpoint = '/customer/profile/address';
        payload = { address: editForm.address };
      }

      const res: any = await apiClient.put(endpoint, payload);
      
      if (res.success || res.id || res.message === 'Success' || res.status === 200) {
        setUser({ ...user, ...payload } as any);
        showNotification('Cập nhật thành công!');
        setEditingField(null);
      } else {
        showNotification(res.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      showNotification('Có lỗi khi cập nhật thông tin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('AvatarFile', avatarFile);

      const res: any = await apiClient.putForm('/customer/profile/avatar', formData);
      if (res.success || res.message === 'Success' || res.status === 200 || res.data) {
        const newAvatarUrl = res.data && typeof res.data === 'string' ? res.data : avatarPreview;
        setUser({ ...user, avatarUrl: newAvatarUrl } as any);
        showNotification('Cập nhật ảnh đại diện thành công!');
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        showNotification(res.message || 'Có lỗi khi cập nhật ảnh', 'error');
      }
    } catch (err) {
      showNotification('Có lỗi khi tải ảnh lên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    try {
      setLoading(true);
      const res: any = await apiClient.put('/customer/profile/password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.success || res.message === 'Success') {
        showNotification('Đổi mật khẩu thành công!');
        setShowPasswordModal(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showNotification(res.message || 'Đổi mật khẩu thất bại', 'error');
      }
    } catch (err) {
      showNotification('Lỗi khi đổi mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Removed manual maskPhone since backend provides maskedPhoneNumber

  return (
    <main className="font-sans bg-[#f9f9f7] text-[#1a1c1b] min-h-screen pt-[80px] pb-20">
      
      {/* Header Banner */}
      <div className="bg-[#06182c] w-full h-40 md:h-52 relative overflow-hidden">
         <img src="https://imageshare13.blob.core.windows.net/logo/backgroup.webp" alt="Cover" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#06182c] to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-16 md:-mt-20 relative z-10">
        
        {/* Identity Card */}
        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 border border-gray-100">
          <div className="relative group shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
              <img src={avatarPreview || user?.avatarUrl || "https://ui-avatars.com/api/?name=" + (user?.name || "U") + "&background=a63b00&color=fff&size=200"} 
                   alt="Avatar" className="w-full h-full object-cover" />
            </div>
            {!avatarFile && (
              <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-2 right-2 w-10 h-10 bg-[#a63b00] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#8a3100] transition-transform hover:scale-105" title="Đổi ảnh đại diện">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
            )}
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" />
          </div>
          
          <div className="flex-grow text-center md:text-left mb-2 md:mb-4 flex flex-col justify-end">
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1c1b] tracking-tight">{user?.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-200 shadow-sm">
                <span className="material-symbols-outlined text-xs">shopping_bag</span>
                {user?.totalOrders || 0} Đơn hàng
              </span>
              <span className="text-gray-500 text-sm font-medium">{user?.email}</span>
            </div>
            
            {avatarFile && (
              <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                <button onClick={handleSaveAvatar} disabled={loading} className="px-4 py-2 bg-[#a63b00] text-white rounded-xl font-bold text-sm hover:bg-[#8a3100] transition-colors shadow-sm">
                  {loading ? 'Đang lưu...' : 'Lưu ảnh'}
                </button>
                <button onClick={handleCancelAvatar} disabled={loading} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Menu */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-2 flex flex-col gap-1">
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-[#1a1c1b] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className="material-symbols-outlined text-xl">person</span>
                  Hồ sơ cá nhân
                </button>
                <button 
                  onClick={() => setActiveTab('security')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-[#1a1c1b] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className="material-symbols-outlined text-xl">security</span>
                  Tài khoản & Bảo mật
                </button>
                <button 
                  onClick={() => setActiveTab('garage')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'garage' ? 'bg-[#1a1c1b] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className="material-symbols-outlined text-xl">directions_car</span>
                  Garage của tôi
                </button>
                <div className="h-px bg-gray-100 my-2 mx-4"></div>
                <Link to="/purchase" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-[#1a1c1b] transition-all">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                  Quản lý đơn hàng
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-grow">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-black text-[#1a1c1b] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <span className="material-symbols-outlined text-[#a63b00]">badge</span>
                  Thông tin cơ bản
                </h2>
                
                <div className="flex flex-col gap-6">
                  
                  {/* Name Field */}
                  <div className="group">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Họ và Tên</label>
                    {editingField === 'name' ? (
                      <div className="flex gap-2">
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="flex-grow px-4 py-2 bg-gray-50 border border-[#a63b00] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a63b00]/20 text-[#1a1c1b] font-medium" autoFocus />
                        <button onClick={() => handleUpdateProfile('name')} disabled={loading} className="px-4 py-2 bg-[#a63b00] text-white rounded-xl font-bold hover:bg-[#8a3100] transition-colors shadow-sm">Lưu</button>
                        <button onClick={() => { setEditingField(null); setEditForm({...editForm, name: user?.name || ''}); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Hủy</button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 group-hover:border-gray-300 transition-colors">
                        <span className="font-medium text-lg text-[#1a1c1b]">{user?.name || "Chưa cập nhật"}</span>
                        <button onClick={() => setEditingField('name')} className="text-gray-400 hover:text-[#a63b00] p-2 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="group">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Số điện thoại</label>
                    {editingField === 'phone' ? (
                      <div>
                        <div className="flex gap-2">
                          <input type="tel" value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className="flex-grow px-4 py-2 bg-gray-50 border border-[#a63b00] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a63b00]/20 text-[#1a1c1b] font-medium tracking-widest" autoFocus />
                          <button onClick={() => handleUpdateProfile('phoneNumber')} disabled={loading} className="px-4 py-2 bg-[#a63b00] text-white rounded-xl font-bold hover:bg-[#8a3100] transition-colors shadow-sm">Lưu</button>
                          <button onClick={() => { setEditingField(null); setEditForm({...editForm, phoneNumber: user?.phoneNumber || ''}); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Hủy</button>
                        </div>
                        {editForm.phoneNumber && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(editForm.phoneNumber) && (
                          <p className="text-red-500 text-xs mt-1 font-medium">Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 group-hover:border-gray-300 transition-colors">
                        <span className="font-medium text-lg text-[#1a1c1b] tracking-wider">{user?.maskedPhoneNumber || "Chưa cập nhật"}</span>
                        <button onClick={() => setEditingField('phone')} className="text-gray-400 hover:text-[#a63b00] p-2 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Address Field */}
                  <div className="group">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Địa chỉ mặc định</label>
                    {editingField === 'address' ? (
                      <div className="flex gap-2 items-start">
                        <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} rows={3} className="flex-grow px-4 py-3 bg-gray-50 border border-[#a63b00] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a63b00]/20 text-[#1a1c1b] font-medium resize-none" autoFocus />
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handleUpdateProfile('address')} disabled={loading} className="px-4 py-2 bg-[#a63b00] text-white rounded-xl font-bold hover:bg-[#8a3100] transition-colors shadow-sm">Lưu</button>
                          <button onClick={() => { setEditingField(null); setEditForm({...editForm, address: user?.address || ''}); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start py-2 border-b border-dashed border-gray-200 group-hover:border-gray-300 transition-colors">
                        <span className="font-medium text-[#1a1c1b] leading-relaxed max-w-lg">{user?.address || "Chưa cập nhật địa chỉ"}</span>
                        <button onClick={() => setEditingField('address')} className="text-gray-400 hover:text-[#a63b00] p-2 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-black text-[#1a1c1b] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <span className="material-symbols-outlined text-[#a63b00]">lock</span>
                  Bảo mật tài khoản
                </h2>
                
                <div className="flex flex-col gap-8">
                  {/* Email (Readonly) */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Địa chỉ Email</label>
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <span className="material-symbols-outlined text-green-500">verified</span>
                      <span className="font-medium text-[#1a1c1b]">{user?.email}</span>
                      <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Đã xác minh</span>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Mật khẩu</label>
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100">
                      <span className="font-black text-2xl text-gray-500 tracking-[0.2em] translate-y-1">********</span>
                      <button onClick={() => setShowPasswordModal(true)} className="ml-auto px-4 py-2 border border-gray-200 text-[#1a1c1b] hover:bg-gray-50 hover:border-gray-300 rounded-xl font-bold text-sm transition-colors shadow-sm">
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Liên kết mạng xã hội</label>
                    <div className="flex flex-col gap-3">
                      <div className={`flex items-center justify-between p-4 rounded-2xl border ${user?.isGoogleLinked ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={`w-6 h-6 ${!user?.isGoogleLinked && 'grayscale opacity-50'}`} />
                          <div>
                            <p className="font-bold text-[#1a1c1b] text-sm">Google</p>
                            <p className="text-xs text-gray-500">{user?.isGoogleLinked ? 'Đã liên kết' : 'Chưa liên kết'}</p>
                          </div>
                        </div>
                        {user?.isGoogleLinked ? (
                          <button className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Hủy liên kết</button>
                        ) : (
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">Liên kết ngay</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GARAGE TAB */}
            {activeTab === 'garage' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-xl font-black text-[#1a1c1b] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#a63b00]">garage_home</span>
                    Garage của tôi
                  </h2>
                  <span className="bg-[#1a1c1b] text-white text-xs font-bold px-3 py-1 rounded-full">0 Xe</span>
                </div>
                
                {/* Empty State */}
                <div className="py-12 flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-6xl text-gray-300">two_wheeler</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1c1b] mb-2">Garage của bạn đang trống!</h3>
                  <p className="text-[#594138] max-w-md mb-8 leading-relaxed">
                    Nơi đây sẽ là trung tâm quản lý tài sản của bạn. Tất cả xe bạn mua sẽ được lưu trữ tại đây với thông tin bảo dưỡng định kỳ.
                  </p>
                  <Link to="/categories" className="px-8 py-3 bg-[#a63b00] hover:bg-[#8a3100] text-white rounded-xl font-bold shadow-md transition-transform hover:-translate-y-1">
                    Sắm xe ngay
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-[#1a1c1b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#a63b00]">key</span>
                Đổi mật khẩu
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6 flex flex-col gap-5">
              <div>
                <label className="text-sm font-bold text-[#1a1c1b] mb-1.5 block">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#a63b00] focus:ring-1 focus:ring-[#a63b00] transition-colors" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-[#1a1c1b] mb-1.5 block">Mật khẩu mới</label>
                <div className="relative">
                  <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} required minLength={6} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#a63b00] focus:ring-1 focus:ring-[#a63b00] transition-colors" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-[#1a1c1b] mb-1.5 block">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required minLength={6} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#a63b00] focus:ring-1 focus:ring-[#a63b00] transition-colors" placeholder="••••••••" />
                </div>
                {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">Mật khẩu xác nhận không khớp!</p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Hủy</button>
                <button type="submit" disabled={loading || (passwordForm.newPassword !== passwordForm.confirmPassword)} className="flex-1 px-4 py-3 bg-[#1a1c1b] text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-md">
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default ProfilePage;
