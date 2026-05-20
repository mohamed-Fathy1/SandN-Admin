export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  total: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedData<T> extends Pagination {
  items: T[];
}

export interface BilingualText {
  ar: string;
  en: string;
}

export interface MediaAsset {
  mediaUrl: string;
  mediaId: string;
}
