import React from "react";

interface ProductInfoFormProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const ProductInfoForm: React.FC<ProductInfoFormProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold mb-6">Product Information</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Product Name
          </label>
          <input
            className="w-full rounded-xl border-slate-200 bg-transparent focus:ring-2 focus:ring-primary/50 py-3 px-4"
            placeholder="e.g. Minimalist Ceramic Vase"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Description
          </label>
          <textarea
            className="w-full rounded-xl border-slate-200 bg-transparent focus:ring-2 focus:ring-primary/50 py-3 px-4 resize-none"
            placeholder="Describe your product's unique features and materials..."
            rows={6}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductInfoForm;
