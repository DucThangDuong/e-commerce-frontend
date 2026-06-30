import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-500 hover:text-[#a63b00] transition-colors mb-8 group font-medium"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Quay lại
        </button>

        <h1 className="text-3xl md:text-4xl font-black text-[#1a1c1b] mb-4 tracking-tight">Chính Sách Bảo Mật</h1>
        <div className="max-w-none text-[#594138] leading-relaxed">
          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">1. Mục đích thu thập thông tin</h2>
          <p className="mb-4">
            Precision Motors đánh giá cao sự tin tưởng của bạn. Chúng tôi thu thập thông tin cá nhân (bao gồm Họ tên, Số điện thoại, Email, Địa chỉ, CMND/CCCD) nhằm mục đích:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 mb-4">
            <li>Xử lý các đơn đặt hàng xe máy và phụ tùng.</li>
            <li>Hỗ trợ thực hiện thủ tục đăng ký xe, bấm biển số theo ủy quyền pháp lý.</li>
            <li>Gửi thông báo về tiến trình giao hàng, nhắc lịch bảo dưỡng định kỳ.</li>
            <li>Cung cấp thông tin các chương trình khuyến mãi, sự kiện lái thử xe (chỉ khi bạn đồng ý).</li>
          </ul>

          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">2. Phạm vi sử dụng thông tin</h2>
          <p className="mb-4">
            Thông tin của khách hàng chỉ được sử dụng nội bộ tại Precision Motors và các đại lý trực thuộc. Chúng tôi có thể chia sẻ thông tin thiết yếu với các đối tác bên thứ ba như:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 mb-4">
            <li>Các cơ quan thuế, công an giao thông (để thực hiện dịch vụ đăng ký xe).</li>
            <li>Đơn vị vận chuyển (để giao xe/phụ kiện tận nơi).</li>
            <li>Đối tác cung cấp dịch vụ thanh toán trực tuyến (VNPay, Momo) với cơ chế mã hóa bảo mật cao nhất.</li>
          </ul>
          <p className="mt-4 font-medium italic mb-4 text-[#a63b00]">
            * Chúng tôi tuyệt đối không mua bán, trao đổi thông tin khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại độc lập.
          </p>

          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">3. Lưu trữ và Bảo mật</h2>
          <p className="mb-4">
            Dữ liệu cá nhân của bạn được lưu trữ trên hệ thống máy chủ bảo mật cao của chúng tôi. Chúng tôi áp dụng các tiêu chuẩn bảo mật SSL/TLS để mã hóa dữ liệu truyền tải. Dữ liệu sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ từ phía khách hàng hoặc theo quy định lưu trữ chứng từ kế toán của Nhà nước.
          </p>

          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">4. Quyền của Khách hàng</h2>
          <p className="mb-4">
            Bạn có quyền truy cập, yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân của mình trên hệ thống của chúng tôi bất cứ lúc nào thông qua phần "Tài khoản của tôi" hoặc liên hệ trực tiếp tổng đài hỗ trợ.
          </p>

          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">5. Thông tin Liên hệ</h2>
          <p className="mb-4">
            Nếu bạn có bất kỳ thắc mắc nào liên quan đến Chính sách bảo mật này, vui lòng liên hệ:
          </p>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-4 text-[#1a1c1b]">
            <p className="font-bold mb-2">Precision Motors Care</p>
            <p className="mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span> privacy@precisionmotors.vn</p>
            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">call</span> 1900-xxxx</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
