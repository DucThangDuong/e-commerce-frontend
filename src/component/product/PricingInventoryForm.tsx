import React from "react";

interface PricingInventoryFormProps {
  basePrice: number;
  stockQuantity: number;
  onBasePriceChange: (value: number) => void;
  onStockQuantityChange: (value: number) => void;
  errors?: { base_price?: string; stock_quantity?: string };
}

const PricingInventoryForm: React.FC<PricingInventoryFormProps> = ({
  basePrice,
  stockQuantity,
  onBasePriceChange,
  onStockQuantityChange,
  errors,
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold mb-6">Pricing &amp; Inventory</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Price <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span
              className={`flex items-center rounded-l-xl border border-r-0 bg-slate-50 text-sm px-4 font-medium text-slate-500 ${
                errors?.base_price ? "border-red-400" : "border-slate-200"
              }`}
            >
              USD
            </span>
            <input
              className={`w-full rounded-r-xl bg-transparent focus:ring-2 focus:ring-primary/50 py-3 px-4 border ${
                errors?.base_price
                  ? "border-red-400 ring-2 ring-red-200"
                  : "border-slate-200"
              } transition-colors`}
              placeholder="0.00"
              type="number"
              min={0}
              step={0.01}
              value={basePrice || ""}
              onChange={(e) =>
                onBasePriceChange(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          {errors?.base_price && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.base_price}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Quantity in Stock <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex items-center border rounded-xl w-36 overflow-hidden ${
              errors?.stock_quantity
                ? "border-red-400 ring-2 ring-red-200"
                : "border-slate-200"
            } transition-colors`}
          >
            <button
              type="button"
              className="flex-1 py-3 text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={() =>
                onStockQuantityChange(Math.max(0, stockQuantity - 1))
              }
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <input
              className="w-12 text-center border-none bg-transparent focus:ring-0 font-bold p-0"
              type="number"
              value={stockQuantity}
              onChange={(e) =>
                onStockQuantityChange(Math.max(0, parseInt(e.target.value) || 0))
              }
            />
            <button
              type="button"
              className="flex-1 py-3 text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={() => onStockQuantityChange(stockQuantity + 1)}
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          {errors?.stock_quantity && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.stock_quantity}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingInventoryForm;
