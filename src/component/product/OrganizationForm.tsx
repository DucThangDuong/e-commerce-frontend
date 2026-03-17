import React, { useState } from "react";
import { apiClient } from "../../untils/apiClient";
import type { Category } from "../../interfaces/category";

interface OrganizationFormProps {
  categoryId: number;
  onCategoryChange: (categoryId: number) => void;
  error?: string;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  categoryId,
  onCategoryChange,
  error,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const handleGet = async () => {
    try {
      const result = await apiClient.get<Category[]>(
        "/category",
      );
      setCategories(result);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  React.useEffect(() => {
    handleGet();
  }, []);
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold mb-6">Organization</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <div
            className={`grid grid-cols-2 gap-2 p-2 rounded-xl ${
              error ? "ring-2 ring-red-200 bg-red-50/30" : ""
            } transition-colors`}
          >
            {categories.map((cat) => (
              <button
                key={cat.categoryId}
                type="button"
                className={`px-4 py-2 text-sm rounded-lg border font-medium transition-colors ${
                  categoryId === cat.categoryId
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-primary"
                }`}
                onClick={() => onCategoryChange(cat.categoryId)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationForm;
