import React from "react";
import Header from "../component/home/Header";
import PopularProduct from "../component/home/PopularSection";
import SummaryProduct from "../component/home/SummaryProductSection";
import Footer from "../component/home/Footer";

const LandingPage: React.FC = () => {
  return (
    <div className="bg-[#fcf9f8] font-['Inter'] text-[#1c1b1b] min-h-screen overflow-x-hidden">
      <Header />
      <PopularProduct />
      <SummaryProduct />
      <Footer />
    </div>
  );
};

export default LandingPage;
