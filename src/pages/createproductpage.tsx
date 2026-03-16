import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/HomeLayout";
import ProductInfoForm from "../component/product/ProductInfoForm";
import PricingInventoryForm from "../component/product/PricingInventoryForm";
import OrganizationForm from "../component/product/OrganizationForm";
import ProductMediaUpload from "../component/product/ProductMediaUpload";
import { apiClient } from "../untils/apiClient";
import type { CreateProductDTO } from "../interfaces/product";

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductDTO>({
    name: "",
    description: "",
    categoryId: 1,
    basePrice: 0,
    stockQuantity: 1,
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    if (formData.basePrice <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/product", formData);
      alert("Product created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-background-light text-slate-900 antialiased min-h-screen font-display">
        <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full px-8 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <a
                  className="hover:text-primary transition-colors cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  Products
                </a>
                <span className="material-symbols-outlined text-xs">
                  chevron_right
                </span>
                <span className="text-slate-900">Add New Product</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Create Listing
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-sm hover:bg-slate-50 transition-colors"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <ProductInfoForm
                name={formData.name}
                description={formData.description}
                onNameChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                onDescriptionChange={(value) =>
                  setFormData((prev) => ({ ...prev, description: value }))
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PricingInventoryForm
                  basePrice={formData.basePrice}
                  stockQuantity={formData.stockQuantity}
                  onBasePriceChange={(value) =>
                    setFormData((prev) => ({ ...prev, basePrice: value }))
                  }
                  onStockQuantityChange={(value) =>
                    setFormData((prev) => ({ ...prev, stockQuantity: value }))
                  }
                />
                <OrganizationForm
                  categoryId={formData.categoryId}
                  onCategoryChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                />
              </div>
            </div>

            {/* Right column */}
            <div>
              <ProductMediaUpload />
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default CreateProductPage;
