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
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateProductDTO>({
    name: "",
    description: "",
    base_price: 0,
    stock_quantity: 1,
    category_id: 1,
  });

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
    }

    if (formData.base_price <= 0) {
      newErrors.base_price = "Price must be greater than 0.";
    }

    if (formData.stock_quantity < 1) {
      newErrors.stock_quantity = "Stock quantity must be at least 1.";
    }

    if (!formData.category_id || formData.category_id <= 0) {
      newErrors.category_id = "Please select a category.";
    }

    if (images.length === 0) {
      newErrors.images = "Please upload at least one product image.";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Scroll to the first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("base_price", formData.base_price.toString());
      submitData.append("stock_quantity", formData.stock_quantity.toString());
      submitData.append("category_id", formData.category_id.toString());
      images.forEach((img) => {
        submitData.append("images", img);
      });

      await apiClient.postForm("/product", submitData);
      alert("Product created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear individual field error when user fixes it
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-background-light text-slate-900 antialiased min-h-screen font-display">
        <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full px-8 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
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

          {/* Validation summary */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
              <span className="material-symbols-outlined text-red-500 mt-0.5">
                error
              </span>
              <div>
                <p className="text-sm font-bold text-red-700 mb-1">
                  Please fix the following errors:
                </p>
                <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
                  {Object.values(errors).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <div id="field-name">
                <ProductInfoForm
                  name={formData.name}
                  description={formData.description}
                  onNameChange={(value) => {
                    setFormData((prev) => ({ ...prev, name: value }));
                    clearError("name");
                  }}
                  onDescriptionChange={(value) => {
                    setFormData((prev) => ({ ...prev, description: value }));
                    clearError("description");
                  }}
                  errors={{
                    name: errors.name,
                    description: errors.description,
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div id="field-base_price">
                  <PricingInventoryForm
                    basePrice={formData.base_price}
                    stockQuantity={formData.stock_quantity}
                    onBasePriceChange={(value) => {
                      setFormData((prev) => ({ ...prev, base_price: value }));
                      clearError("base_price");
                    }}
                    onStockQuantityChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        stock_quantity: value,
                      }));
                      clearError("stock_quantity");
                    }}
                    errors={{
                      base_price: errors.base_price,
                      stock_quantity: errors.stock_quantity,
                    }}
                  />
                </div>
                <div id="field-category_id">
                  <OrganizationForm
                    categoryId={formData.category_id}
                    onCategoryChange={(value) => {
                      setFormData((prev) => ({ ...prev, category_id: value }));
                      clearError("category_id");
                    }}
                    error={errors.category_id}
                  />
                </div>
              </div>
            </div>

            {/* Right column */}
            <div id="field-images">
              <ProductMediaUpload
                images={images}
                onImagesChange={(newImages) => {
                  setImages(newImages);
                  if (newImages.length > 0) clearError("images");
                }}
              />
              {errors.images && (
                <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    error
                  </span>
                  {errors.images}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default CreateProductPage;
