import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../zustand/store';
import { apiClient } from '../untils/apiClient';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

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

  // Map Picker State
  const [tempPosition, setTempPosition] = useState<L.LatLng | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const confirmMapLocation = async () => {
    if (!tempPosition) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempPosition.lat}&lon=${tempPosition.lng}&accept-language=vi`);
      const data = await res.json();
      if (data && data.display_name) {
        setEditForm(prev => ({...prev, address: data.display_name}));
        setShowMapModal(false);
      } else {
        showNotification('Không tìm thấy địa chỉ cho vị trí này', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Lỗi khi lấy địa chỉ', 'error');
    } finally {
      setIsGeocoding(false);
    }
  };

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
      <div className="bg-gray-900 w-full h-48 md:h-64 relative overflow-hidden">
         <img src="https://imageshare13.blob.core.windows.net/logo/backgroup.webp" alt="Cover" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-20 md:-mt-24 relative z-10">
        
        {/* Identity Card */}
        <div className="bg-white rounded-[2rem] shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-8 mb-10 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative group shrink-0 z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white relative">
              <img src={avatarPreview || user?.avatarUrl || "https://ui-avatars.com/api/?name=" + (user?.name || "U") + "&background=a63b00&color=fff&size=200"} 
                   alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
              </div>
            </div>
            {!avatarFile && (
              <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-2 right-2 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover transition-transform hover:scale-105" title="Đổi ảnh đại diện">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </button>
            )}
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" />
          </div>
          
          <div className="flex-grow text-center md:text-left mb-2 md:mb-4 flex flex-col justify-end z-10">
            <h1 className="text-3xl md:text-4xl font-heading font-black text-[#1a1c1b] tracking-tight uppercase mb-1">{user?.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
              <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                {user?.totalOrders || 0} Đơn hàng
              </span>
              <span className="text-gray-500 font-medium bg-gray-100 px-4 py-1.5 rounded-full text-sm">{user?.email}</span>
            </div>
            
            {avatarFile && (
              <div className="flex items-center justify-center md:justify-start gap-3 mt-6">
                <button onClick={handleSaveAvatar} disabled={loading} className="px-6 py-2.5 bg-primary text-white rounded-full font-heading font-bold tracking-widest text-sm hover:bg-primary-hover transition-all shadow-sm uppercase">
                  {loading ? 'Đang lưu...' : 'Lưu ảnh'}
                </button>
                <button onClick={handleCancelAvatar} disabled={loading} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-full font-heading font-bold tracking-widest text-sm hover:bg-gray-200 transition-all uppercase">
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Menu */}
          <aside className="w-full md:w-72 shrink-0">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden sticky top-28 p-3">
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-heading font-bold uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-gray-900 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">person</span>
                  Hồ sơ cá nhân
                </button>
                <button 
                  onClick={() => setActiveTab('security')} 
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-heading font-bold uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-gray-900 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">security</span>
                  Bảo mật
                </button>
                <button 
                  onClick={() => setActiveTab('garage')} 
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-heading font-bold uppercase tracking-widest transition-all ${activeTab === 'garage' ? 'bg-gray-900 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a1c1b]'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">directions_car</span>
                  Garage của tôi
                </button>
                <div className="h-px bg-gray-100 my-2 mx-5"></div>
                <Link to="/purchase" className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-heading font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 hover:text-[#1a1c1b] transition-all">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  Quản lý đơn hàng
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-grow">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-10 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <h2 className="text-2xl font-heading font-black text-[#1a1c1b] mb-10 flex items-center gap-3 uppercase tracking-tight relative z-10 border-b border-gray-100 pb-6">
                  <span className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">badge</span>
                  </span>
                  Thông tin cơ bản
                </h2>
                
                <div className="flex flex-col gap-6 relative z-10">
                  
                  {/* Name Field */}
                  <div className="group bg-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all">
                    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-3 block">Họ và Tên</label>
                    {editingField === 'name' ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="flex-grow px-5 py-3.5 bg-white border-2 border-primary/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-[#1a1c1b] font-bold font-heading uppercase tracking-wide" autoFocus />
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateProfile('name')} disabled={loading} className="flex-1 sm:flex-none px-6 py-3.5 bg-primary text-white rounded-xl font-heading font-bold uppercase tracking-wider text-sm hover:bg-primary-hover transition-all shadow-sm">Lưu</button>
                          <button onClick={() => { setEditingField(null); setEditForm({...editForm, name: user?.name || ''}); }} className="flex-1 sm:flex-none px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-heading font-bold uppercase tracking-wider text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center py-1">
                        <span className="font-heading font-black text-2xl text-[#1a1c1b] uppercase tracking-tight">{user?.name || "Chưa cập nhật"}</span>
                        <button onClick={() => setEditingField('name')} className="text-gray-400 hover:text-primary w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="group bg-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all">
                    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-3 block">Số điện thoại</label>
                    {editingField === 'phone' ? (
                      <div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input type="tel" value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className="flex-grow px-5 py-3.5 bg-white border-2 border-primary/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-[#1a1c1b] font-bold font-heading tracking-widest" autoFocus />
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateProfile('phoneNumber')} disabled={loading} className="flex-1 sm:flex-none px-6 py-3.5 bg-primary text-white rounded-xl font-heading font-bold uppercase tracking-wider text-sm hover:bg-primary-hover transition-all shadow-sm">Lưu</button>
                            <button onClick={() => { setEditingField(null); setEditForm({...editForm, phoneNumber: user?.phoneNumber || ''}); }} className="flex-1 sm:flex-none px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-heading font-bold uppercase tracking-wider text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                          </div>
                        </div>
                        {editForm.phoneNumber && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(editForm.phoneNumber) && (
                          <p className="text-red-500 text-xs mt-2 font-bold uppercase tracking-wider">Số điện thoại không hợp lệ</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center py-1">
                        <span className="font-heading font-black text-2xl text-[#1a1c1b] tracking-wider">{user?.maskedPhoneNumber || "Chưa cập nhật"}</span>
                        <button onClick={() => setEditingField('phone')} className="text-gray-400 hover:text-primary w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Address Field */}
                  <div className="group bg-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all">
                    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-3 block">Địa chỉ mặc định</label>
                    {editingField === 'address' ? (
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} rows={3} className="w-full px-5 py-4 bg-white border-2 border-primary/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-[#1a1c1b] font-medium resize-none leading-relaxed pr-16" autoFocus />
                          <button type="button" onClick={() => setShowMapModal(true)} title="Chọn trên bản đồ" className="absolute right-3 bottom-3 w-10 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[20px]">map</span>
                          </button>
                        </div>
                        <div className="flex justify-end gap-3 mt-1">
                          <button onClick={() => { setEditingField(null); setEditForm({...editForm, address: user?.address || ''}); }} className="px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-heading font-bold uppercase tracking-wider text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                          <button onClick={() => handleUpdateProfile('address')} disabled={loading} className="px-8 py-3.5 bg-primary text-white rounded-xl font-heading font-bold uppercase tracking-wider text-sm hover:bg-primary-hover transition-all shadow-sm">Lưu</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start py-1">
                        <span className="font-medium text-lg text-[#1a1c1b] leading-relaxed max-w-2xl">{user?.address || "Chưa cập nhật địa chỉ"}</span>
                        <button onClick={() => setEditingField('address')} className="text-gray-400 hover:text-primary w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shrink-0">
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
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-10 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gray-900/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <h2 className="text-2xl font-heading font-black text-[#1a1c1b] mb-10 flex items-center gap-3 uppercase tracking-tight relative z-10 border-b border-gray-100 pb-6">
                  <span className="w-12 h-12 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">security</span>
                  </span>
                  Bảo mật tài khoản
                </h2>
                
                <div className="flex flex-col gap-8 relative z-10">
                  {/* Email (Readonly) */}
                  <div>
                    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-3 block">Địa chỉ Email</label>
                    <div className="flex items-center gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                      </div>
                      <span className="font-bold text-lg text-[#1a1c1b] tracking-wide">{user?.email}</span>
                      <span className="ml-auto text-[10px] bg-green-500 text-white px-3 py-1.5 rounded-full font-heading font-bold uppercase tracking-widest shadow-sm">Đã xác minh</span>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-3 block">Mật khẩu</label>
                    <div className="flex items-center gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                      <span className="font-black text-3xl text-gray-400 tracking-[0.2em] translate-y-2">••••••••</span>
                      <button onClick={() => setShowPasswordModal(true)} className="ml-auto px-6 py-3 bg-white border-2 border-gray-200 text-[#1a1c1b] hover:bg-gray-50 hover:border-gray-300 rounded-xl font-heading font-bold text-sm tracking-wider uppercase transition-all shadow-sm">
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-3 block">Liên kết mạng xã hội</label>
                    <div className="flex flex-col gap-3">
                      <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${user?.isGoogleLinked ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={`w-7 h-7 ${!user?.isGoogleLinked && 'grayscale opacity-50'}`} />
                          </div>
                          <div>
                            <p className="font-heading font-black text-lg text-[#1a1c1b] tracking-wide uppercase">Google</p>
                            <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mt-0.5">{user?.isGoogleLinked ? 'Đã liên kết' : 'Chưa liên kết'}</p>
                          </div>
                        </div>
                        {user?.isGoogleLinked ? (
                          <button className="text-red-500 hover:text-white text-xs font-heading font-bold px-4 py-2 rounded-lg hover:bg-red-500 transition-colors uppercase tracking-widest border border-red-200 hover:border-red-500">Hủy liên kết</button>
                        ) : (
                          <button className="text-blue-600 hover:text-white text-xs font-heading font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors uppercase tracking-widest border border-blue-200 hover:border-blue-600">Liên kết ngay</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GARAGE TAB */}
            {activeTab === 'garage' && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-10 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6 mb-10 relative z-10">
                  <h2 className="text-2xl font-heading font-black text-[#1a1c1b] flex items-center gap-3 uppercase tracking-tight">
                    <span className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">garage_home</span>
                    </span>
                    Garage của tôi
                  </h2>
                  <span className="bg-gray-900 text-white text-xs font-heading font-bold px-4 py-2 rounded-full tracking-widest uppercase shadow-sm">0 Xe trong Garage</span>
                </div>
                
                {/* Empty State */}
                <div className="py-16 flex flex-col items-center text-center relative z-10">
                  <div className="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative border-4 border-white shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-transparent rounded-full z-0"></div>
                    <span className="material-symbols-outlined text-[80px] text-gray-300 relative z-10 drop-shadow-sm">two_wheeler</span>
                  </div>
                  <h3 className="text-3xl font-heading font-black text-[#1a1c1b] mb-4 uppercase tracking-tight">Garage của bạn đang trống!</h3>
                  <p className="text-gray-500 max-w-lg mb-10 leading-relaxed text-sm">
                    Nơi đây sẽ là trung tâm quản lý tài sản của bạn. Tất cả xe bạn mua sẽ được lưu trữ tại đây với thông tin bảo dưỡng định kỳ và các đặc quyền VIP.
                  </p>
                  <Link to="/categories" className="px-10 py-4 bg-primary hover:bg-primary-hover text-white rounded-full font-heading font-bold uppercase tracking-widest text-sm shadow-lg shadow-primary/30 transition-all hover:-translate-y-1 hover:shadow-xl">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-heading font-black text-xl text-[#1a1c1b] flex items-center gap-3 uppercase tracking-tight">
                <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">key</span>
                </span>
                Đổi mật khẩu
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-red-500 transition-colors w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-8 flex flex-col gap-6">
              <div>
                <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-2 block">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-2 block">Mật khẩu mới</label>
                <div className="relative">
                  <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} required minLength={6} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest mb-2 block">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required minLength={6} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg" placeholder="••••••••" />
                </div>
                {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-red-500 text-xs mt-2 font-bold uppercase tracking-widest">Mật khẩu xác nhận không khớp!</p>
                )}
              </div>
              
              <div className="mt-4 pt-6 border-t border-gray-100 flex gap-4">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-heading font-bold uppercase tracking-widest text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" disabled={loading || (passwordForm.newPassword !== passwordForm.confirmPassword)} className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-xl font-heading font-bold uppercase tracking-widest text-sm hover:bg-black transition-colors disabled:opacity-50 disabled:hover:bg-gray-900 shadow-md">
                  {loading ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="font-heading font-black uppercase tracking-tight text-[#1a1c1b] text-xl flex items-center gap-3 relative z-10">
                <span className="material-symbols-outlined text-primary text-3xl">pin_drop</span>
                Ghim vị trí giao hàng
              </h3>
              <button type="button" onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-red-500 transition-colors w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-red-50 rounded-full relative z-10">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-grow relative bg-gray-100 z-0">
              <MapContainer 
                center={tempPosition || [10.8231, 106.6297]} // Default to Ho Chi Minh City
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={setTempPosition} />
                {tempPosition && <Marker position={tempPosition} />}
              </MapContainer>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 text-white flex items-center gap-3 pointer-events-none animate-bounce">
                <span className="material-symbols-outlined text-yellow-400">touch_app</span>
                <span className="font-heading font-bold uppercase tracking-widest text-[11px]">Chạm vào bản đồ để chọn vị trí</span>
              </div>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-end gap-3 shrink-0">
               <button 
                 type="button"
                 onClick={() => setShowMapModal(false)}
                 className="px-8 py-3.5 bg-white border border-gray-200 text-[#1a1c1b] rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto text-center"
               >
                 Đóng bản đồ
               </button>
               <button 
                 type="button"
                 disabled={!tempPosition || isGeocoding}
                 onClick={confirmMapLocation}
                 className="px-8 py-3.5 bg-primary text-white rounded-xl font-heading font-bold uppercase tracking-widest text-[11px] hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
               >
                 {isGeocoding ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : null}
                 Xác nhận vị trí này
               </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default ProfilePage;
