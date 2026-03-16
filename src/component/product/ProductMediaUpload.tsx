import React from "react";

const ProductMediaUpload: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Product Media</h3>
          <button
            type="button"
            className="text-primary text-sm font-semibold hover:underline"
          >
            Add Link
          </button>
        </div>
        <div className="border-2 border-dashed border-slate-200 rounded-xl aspect-square flex flex-col items-center justify-center p-8 bg-slate-50/50 group cursor-pointer hover:border-primary transition-colors">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">
              cloud_upload
            </span>
          </div>
          <p className="text-sm font-bold text-center mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-slate-500 text-center">
            PNG, JPG or WEBP (Max 1200x1200px)
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined">
              add_photo_alternate
            </span>
          </div>
        </div>
      </div>

      {/* Pro tip */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary">info</span>
          <div>
            <h4 className="text-sm font-bold text-primary mb-1">Pro Tip</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Listings with at least 3 high-quality images and a detailed
              description convert 40% better on average.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductMediaUpload;
