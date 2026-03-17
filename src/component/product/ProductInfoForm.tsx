import React from "react";

interface ProductInfoFormProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  errors?: { name?: string; description?: string };
}

const ProductInfoForm: React.FC<ProductInfoFormProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  errors,
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold mb-6">Product Information</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full rounded-xl bg-transparent focus:ring-2 focus:ring-primary/50 py-3 px-4 border ${
              errors?.name
                ? "border-red-400 ring-2 ring-red-200"
                : "border-slate-200"
            } transition-colors`}
            placeholder="e.g. Minimalist Ceramic Vase"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
          {errors?.name && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            className={`w-full rounded-xl bg-transparent focus:ring-2 focus:ring-primary/50 py-3 px-4 resize-none border ${
              errors?.description
                ? "border-red-400 ring-2 ring-red-200"
                : "border-slate-200"
            } transition-colors`}
            placeholder="Describe your product's unique features and materials..."
            rows={6}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
          {errors?.description && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductInfoForm;
