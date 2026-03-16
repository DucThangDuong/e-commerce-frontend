import React from "react";

interface CategoryOption {
  id: number;
  label: string;
}

const categories: CategoryOption[] = [
  { id: 1, label: "Home Decor" },
  { id: 2, label: "Kitchen" },
  { id: 3, label: "Lifestyle" },
  { id: 4, label: "Furniture" },
];

interface OrganizationFormProps {
  categoryId: number;
  onCategoryChange: (categoryId: number) => void;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  categoryId,
  onCategoryChange,
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold mb-6">Organization</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`px-4 py-2 text-sm rounded-lg border font-medium transition-colors ${
                  categoryId === cat.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-primary"
                }`}
                onClick={() => onCategoryChange(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationForm;
