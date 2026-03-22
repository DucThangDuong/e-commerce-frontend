import React from "react";
import Header from "../component/landing/Header";
import HeroSection from "../component/landing/HeroSection";
import TechnicalSpecs from "../component/landing/TechnicalSpecs";
import Footer from "../component/landing/Footer";

const LandingPage: React.FC = () => {
  return (
    <div className="bg-[#fcf9f8] font-['Inter'] text-[#1c1b1b] min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <TechnicalSpecs />
      <Footer />
    </div>
  );
};

export default LandingPage;
