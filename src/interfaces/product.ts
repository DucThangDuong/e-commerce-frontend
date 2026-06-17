export interface ResProductColorDto {
  colorId: number;
  colorName: string;
  priceAdjustment?: number | null;
  stockQuantity: number;
  imageUrls?: string[] | null;
}

export interface ResProductDto {
  productId: number;
  categoryId: number;
  brandId?: number | null;
  name: string;
  description?: string | null;
  basePrice: number;
  imageUrls?: string[] | null;
  colors: ResProductColorDto[];
  activePromotion?: { name: string; discountPercentage: number } | null;
  specifications?: any[];
  images?: any[];
}

export interface FileUploadDto {
  stream: any; // Stream is not a standard frontend type, maybe Blob or File if needed
  fileName: string;
  contentType: string;
}

export interface ResFeaturedProductDto {
  featuredId: number;
  productId: number;
  displayOrder?: number | null;
  startDate?: string | null; // DateTime maps to string in TS
  endDate?: string | null;
  product: ResProductDto;
}

export interface ResPagedProductDto {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  products: ResProductDto[];
}