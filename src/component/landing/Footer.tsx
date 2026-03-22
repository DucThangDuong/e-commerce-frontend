import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-100 w-full pt-20 pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-7xl mx-auto px-8">
        <div className="col-span-2 md:col-span-1 space-y-6">
          <div className="font-['Space_Grotesk'] font-extrabold text-zinc-900 text-2xl italic tracking-tighter uppercase">
            PRECISION MOTORS
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed font-body">
            The intersection of mechanical excellence and kinetic artistry. Engineering speed for the bold.
          </p>
          <div className="flex space-x-4">
            <span className="material-symbols-outlined text-zinc-400 hover:text-[#b90014] cursor-pointer transition-colors">public</span>
            <span className="material-symbols-outlined text-zinc-400 hover:text-[#b90014] cursor-pointer transition-colors">share</span>
            <span className="material-symbols-outlined text-zinc-400 hover:text-[#b90014] cursor-pointer transition-colors">alternate_email</span>
          </div>
        </div>
        <div className="space-y-6">
          <h5 className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-xs text-zinc-900">
            Experience
          </h5>
          <ul className="space-y-4 font-['Inter'] text-sm tracking-wide">
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Test Ride</a></li>
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Service Booking</a></li>
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Pre-Owned</a></li>
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Racing Hub</a></li>
          </ul>
        </div>
        <div className="space-y-6">
          <h5 className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-xs text-zinc-900">
            Showroom
          </h5>
          <ul className="space-y-4 font-['Inter'] text-sm tracking-wide">
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Locations</a></li>
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Contact</a></li>
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Events</a></li>
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">News</a></li>
          </ul>
        </div>
        <div className="space-y-6">
          <h5 className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-xs text-zinc-900">
            Legal
          </h5>
          <ul className="space-y-4 font-['Inter'] text-sm tracking-wide">
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Privacy Policy</a></li>
            <li><a className="text-zinc-500 hover:text-zinc-900 hover:underline decoration-red-600 underline-offset-4 transition-all duration-200" href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
