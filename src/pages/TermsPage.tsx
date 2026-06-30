import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsPage: React.FC = () => {
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

        <h1 className="text-3xl md:text-4xl font-black text-[#1a1c1b] mb-4 tracking-tight">Điều Khoản Dịch Vụ</h1>
        <div className="max-w-none text-[#594138] leading-relaxed">
          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">1. Chấp nhận Điều khoản</h2>
          <p className="mb-4">
            Chào mừng bạn đến với Precision Motors. Bằng việc truy cập, duyệt và sử dụng trang web của chúng tôi để mua sắm các sản phẩm xe máy, phụ tùng và dịch vụ liên quan, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản và điều kiện được quy định dưới đây.
          </p>

          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">2. Điều kiện giao dịch</h2>
          <p className="mb-4">
            Tất cả các giao dịch mua bán xe máy trên nền tảng của Precision Motors đều tuân thủ nghiêm ngặt quy định pháp luật Việt Nam. 
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 mb-4">
            <li>Khách hàng mua xe phải đủ 18 tuổi trở lên, có đủ năng lực hành vi dân sự.</li>
            <li>Thông tin cung cấp trong quá trình thanh toán và đăng ký biển số (nếu có yêu cầu dịch vụ) phải đảm bảo độ chính xác tuyệt đối. Chúng tôi không chịu trách nhiệm đối với các rủi ro phát sinh do sai lệch thông tin từ phía khách hàng.</li>
            <li>Giá hiển thị trên website (trừ khi có ghi chú khác) đã bao gồm thuế GTGT nhưng chưa bao gồm lệ phí trước bạ, phí cấp biển số và các khoản phí lăn bánh khác.</li>
          </ul>

          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">3. Quy định về Giao nhận xe</h2>
          <p className="mb-4">
            Precision Motors hỗ trợ giao xe trực tiếp tại hệ thống showroom hoặc giao tận nhà (tùy khu vực địa lý).
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 mb-4">
            <li>Thời gian giao xe dự kiến từ 1 - 7 ngày làm việc tùy vào tình trạng sẵn có của sản phẩm.</li>
            <li>Khách hàng có trách nhiệm đồng kiểm tra tình trạng vật lý của xe, xác nhận số khung, số máy trước khi ký biên bản bàn giao.</li>
          </ul>

          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">4. Chính sách Đổi trả & Bảo hành</h2>
          <p className="mb-4">
            Chúng tôi cam kết phân phối xe máy chính hãng và áp dụng chính sách bảo hành của nhà sản xuất (thông thường từ 3 năm hoặc 30.000km).
            Xe đã qua sử dụng và hoàn tất thủ tục đăng ký biển số sẽ không được áp dụng chính sách đổi trả, ngoại trừ trường hợp lỗi kỹ thuật nghiêm trọng từ nhà sản xuất được xác nhận bởi chuyên gia của chúng tôi.
          </p>

          <h2 className="text-xl font-bold text-[#1a1c1b] mt-8 mb-4">5. Giới hạn Trách nhiệm</h2>
          <p className="mb-4">
            Precision Motors không chịu trách nhiệm cho các thiệt hại gián tiếp, ngẫu nhiên hoặc hậu quả phát sinh từ việc sử dụng hoặc không thể sử dụng sản phẩm mua từ chúng tôi khi khách hàng vi phạm quy định an toàn giao thông.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
