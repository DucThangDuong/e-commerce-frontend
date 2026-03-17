import React, { useRef } from "react";

interface ProductMediaUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

const ProductMediaUpload: React.FC<ProductMediaUploadProps> = ({
  images,
  onImagesChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onImagesChange([...images, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (droppedFiles.length > 0) {
        onImagesChange([...images, ...droppedFiles]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Product Media</h3>
          <span className="text-xs text-slate-400 font-medium">
            {images.length} image{images.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 bg-slate-50/50 group cursor-pointer hover:border-primary transition-colors"
          style={{ minHeight: images.length === 0 ? "240px" : "160px" }}
          onClick={openFilePicker}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">
              cloud_upload
            </span>
          </div>
          <p className="text-sm font-bold text-center mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-slate-500 text-center">
            PNG, JPG or WEBP — Select multiple images
          </p>
        </div>

        {/* Image previews - horizontal scrollable */}
        {images.length > 0 && (
          <div
            className="mt-4 flex gap-3 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 transparent",
            }}
          >
            {images.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="relative flex-shrink-0 group/thumb"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:scale-110 transition-all opacity-0 group-hover/thumb:opacity-100"
                  title="Remove image"
                >
                  <span className="text-xs font-bold leading-none">✕</span>
                </button>
                {/* File name tooltip on hover */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none z-10">
                  {file.name.length > 15
                    ? file.name.substring(0, 12) + "..."
                    : file.name}
                </div>
              </div>
            ))}

            {/* Add more images button */}
            <div
              className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-colors cursor-pointer"
              onClick={openFilePicker}
            >
              <span className="material-symbols-outlined">
                add_photo_alternate
              </span>
            </div>
          </div>
        )}
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
