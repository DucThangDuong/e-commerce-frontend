import React from 'react';

const TechnicalSpecs: React.FC = () => {
  return (
    <section className="bg-[#f6f3f2] py-24">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20">
          <div className="space-y-4">
            <h3 className="font-['Space_Grotesk'] text-5xl font-black uppercase tracking-tighter">
              THE FLEET
            </h3>
            <p className="text-[#5d3f3c] max-w-sm">
              Select your discipline. Each machine is tuned for a specific emotional frequency.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sports Category */}
          <div className="group cursor-pointer">
            <div className="bg-[#ffffff] overflow-hidden transition-all duration-500 group-hover:bg-[#fcf9f8] p-2">
              <div className="relative h-[400px] overflow-hidden bg-[#f0edec]">
                <img
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  alt="Aggressive black sportbike front view"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzV9FrVPOW8-Hk9v0PVfLGAFnGHCuZaIFPU4BcSQb4Vyuua5h5tirpRzD8GAS8jFqFLJXFEZqkjld-ZMYvYCHVZVyRqCXTHXX7XaVZjrgrrfkO_J0-U49Ck_JXOOkVLUofqU7qz34k5aIfu-tbcfZbU5FnkSZ8M9zPvfzCcXogwNvDSQwukp_562EFOsdCPJl7z4Yre1mFt5FS3upLeP9LkHpxvYHfdpRrBJViibpXFR3HmBGwKLboXEtyqdJuFKuNxPb5j70S4yg"
                />
                <div className="absolute bottom-6 left-6">
                  <span className="bg-[#cde5ff] text-[#001d32] px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    SPORTS
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <h4 className="font-['Space_Grotesk'] text-3xl font-extrabold uppercase tracking-tighter">
                    VELOCE RR
                  </h4>
                  <span className="text-[#b90014] font-['Space_Grotesk'] font-bold">
                    $24,900
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-[#e7bdb8]/10 pt-6">
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Displacement
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">998 cc</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Max Power
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">215 hp</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Top Speed
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">299 km/h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Cruiser Category */}
          <div className="group cursor-pointer">
            <div className="bg-[#ffffff] overflow-hidden transition-all duration-500 group-hover:bg-[#fcf9f8] p-2">
              <div className="relative h-[400px] overflow-hidden bg-[#f0edec]">
                <img
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  alt="Chrome detailed cruiser motorcycle"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHmR-o9RlW1E0fFjtcESH4BVIjEG4mxJt1DHiZELbU1zTw_iB6G8Gm5CU970jqLedYZ_A4MfQRehLNHGF7Hf5JJyk13ClGMKOlOem1WyPEbydMCxePTEo-PWtedG7FuWdZf-2fVl2ElC_Oe87vets9H9l8hPkdHRvk4eXYSUyI6_DWyVeBOJwbJ_grf0KZQDAnvNpqRtLxJ1NH9Rq4emkYj6VpnYuxq6RN8WQ4_Np6ASB2HJuHquYxZciokRv7ZlAA6AY2mI0uFXo"
                />
                <div className="absolute bottom-6 left-6">
                  <span className="bg-[#cde5ff] text-[#001d32] px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    CRUISER
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <h4 className="font-['Space_Grotesk'] text-3xl font-extrabold uppercase tracking-tighter">
                    LOW RIDER X
                  </h4>
                  <span className="text-[#b90014] font-['Space_Grotesk'] font-bold">
                    $18,400
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-[#e7bdb8]/10 pt-6">
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Displacement
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">1868 cc</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Max Power
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">95 hp</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Top Speed
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">190 km/h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Touring Category */}
          <div className="group cursor-pointer">
            <div className="bg-[#ffffff] overflow-hidden transition-all duration-500 group-hover:bg-[#fcf9f8] p-2">
              <div className="relative h-[400px] overflow-hidden bg-[#f0edec]">
                <img
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  alt="Large touring motorcycle for long trips"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBiehcWchqzS4_-diou1jQffCQMWHguwF98g4cDXS3-KXRedYOuTuMXtuH5fv6LLC6e7uNuW7gULVC9EIj_yI4h3-d4vGyQM6KFMhH2foQ6XwQ_7ph_RHmGEbR4vqlo5EQjv_qPbefECoPow4w2zUlOXj9a53cj5VSRnvztAJlt0HLWiGqxNiSMDDT6CtDVYDOXanvQNCmcO6fjjkH3vv8tJvPwfuF-_O_jAjbQzC51ea2g8HgWgUKxnY9fVHHPVeqtsUOOZppZ5w"
                />
                <div className="absolute bottom-6 left-6">
                  <span className="bg-[#cde5ff] text-[#001d32] px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    TOURING
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <h4 className="font-['Space_Grotesk'] text-3xl font-extrabold uppercase tracking-tighter">
                    HORIZON GT
                  </h4>
                  <span className="text-[#b90014] font-['Space_Grotesk'] font-bold">
                    $31,200
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-[#e7bdb8]/10 pt-6">
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Displacement
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">1250 cc</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Max Power
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">150 hp</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#926e6b] font-bold uppercase tracking-widest mb-1">
                      Top Speed
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-lg">220 km/h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalSpecs;
