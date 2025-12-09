// ============================================
// 📁 ReviewList.jsx - Product-wise Review System
// ============================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { 
  Star, 
  Eye, 
  Trash2, 
  X, 
  Calendar, 
  User, 
  Package,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Award
} from "lucide-react";

export default function ReviewList() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [imageModal, setImageModal] = useState({ open: false, images: [], currentIndex: 0 });
  
  const queryClient = useQueryClient();

  // Fetch Products with Review Counts
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-reviews", page, searchQuery],
    queryFn: async () => {
      const res = await api.get("/admin/reviews/by-products", { 
        params: { 
          page, 
          limit: 20,
          search: searchQuery
        } 
      });
      return res.data;
    },
    enabled: !selectedProduct, // Only fetch when no product is selected
  });

  // Fetch Reviews for Selected Product
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["product-reviews", selectedProduct?._id],
    queryFn: async () => {
      const res = await api.get("/admin/reviews", {
        params: {
          productId: selectedProduct._id,
          limit: 1000 // Get all reviews for this product
        }
      });
      return res.data;
    },
    enabled: !!selectedProduct,
  });

  // Delete Review Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["product-reviews"]);
      queryClient.invalidateQueries(["products-reviews"]);
      setSelectedReview(null);
    },
  });

  const products = productsData?.data || [];
  const reviews = reviewsData?.data || [];
  const pagination = productsData?.pagination || {};

  const openImageModal = (images, index = 0) => {
    setImageModal({ open: true, images, currentIndex: index });
  };

  const closeImageModal = () => {
    setImageModal({ open: false, images: [], currentIndex: 0 });
  };

  // Show Products List
  if (!selectedProduct) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Product Reviews</h1>
              <p className="text-teal-100">Manage reviews by product</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{productsData?.totalProducts || 0}</div>
                <div className="text-sm text-teal-100">Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{productsData?.totalReviews || 0}</div>
                <div className="text-sm text-teal-100">Total Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center gap-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  {productsData?.averageRating?.toFixed(1) || "0.0"}
                </div>
                <div className="text-sm text-teal-100">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {/* Search */}
          <div className="p-6 border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="flex justify-center py-32">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-500">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No products found</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="border rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Product Image */}
                    <div className="relative mb-3 overflow-hidden rounded-lg">
                      <img
                        src={product.image || "/placeholder.png"}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Rating Badge */}
                      <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-lg">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-sm">{product.averageRating?.toFixed(1) || "0.0"}</span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-semibold">{product.reviewCount}</span>
                        <span>reviews</span>
                      </div>
                      {product.hasImages && (
                        <div className="flex items-center gap-1 text-teal-600">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-xs font-medium">Has Images</span>
                        </div>
                      )}
                    </div>

                    {/* Rating Distribution Mini */}
                    <div className="flex gap-1 mb-3">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = product.ratingDistribution?.[rating] || 0;
                        const percentage = product.reviewCount > 0 
                          ? (count / product.reviewCount) * 100 
                          : 0;
                        return (
                          <div
                            key={rating}
                            className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
                            title={`${rating}★: ${count} reviews`}
                          >
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* View Button */}
                    <button className="w-full py-2 bg-teal-50 text-teal-600 rounded-lg font-medium hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 group-hover:bg-teal-600 group-hover:text-white">
                      <Eye className="w-4 h-4" />
                      View All Reviews
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-6 border-t">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === pageNum
                        ? "bg-teal-600 text-white font-semibold"
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {pagination.pages > 5 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => setPage(pagination.pages)}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                  >
                    {pagination.pages}
                  </button>
                </>
              )}

              <button
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show Reviews for Selected Product
  return (
    <div className="p-6 space-y-6">
      {/* Back Button & Product Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <button
          onClick={() => {
            setSelectedProduct(null);
            setPage(1);
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        <div className="flex items-start gap-6">
          {/* Product Image */}
          <img
            src={selectedProduct.image || "/placeholder.png"}
            alt={selectedProduct.name}
            className="w-32 h-32 rounded-xl object-cover border"
          />

          {/* Product Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
            
            {/* Stats Row */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold">{selectedProduct.averageRating?.toFixed(1)}</span>
                <span className="text-gray-500">({selectedProduct.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = selectedProduct.ratingDistribution?.[rating] || 0;
                const percentage = selectedProduct.reviewCount > 0 
                  ? (count / selectedProduct.reviewCount) * 100 
                  : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="font-medium">{rating}</span>
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">All Reviews ({reviews.length})</h3>
        </div>

        {reviewsLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium">No reviews yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {reviews.map((review) => (
              <div key={review._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-teal-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* User Info & Rating */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.user?.name}</h4>
                        <p className="text-sm text-gray-500">{review.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Review Comment */}
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {review.comment || "No comment provided"}
                    </p>

                    {/* Review Images */}
                    {review.images?.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.images.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => openImageModal(review.images, index)}
                            className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-teal-500 transition-all"
                          >
                            <img
                              src={img.url}
                              alt={`Review ${index + 1}`}
                              className="w-20 h-20 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this review?")) {
                            deleteMutation.mutate(review._id);
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onDelete={() => deleteMutation.mutate(selectedReview._id)}
          onOpenImages={(images) => openImageModal(images)}
        />
      )}

      {/* Image Gallery Modal */}
      {imageModal.open && (
        <ImageGalleryModal
          images={imageModal.images}
          currentIndex={imageModal.currentIndex}
          onClose={closeImageModal}
        />
      )}
    </div>
  );
}

// ============================================
// 📁 ReviewDetailModal Component
// ============================================

function ReviewDetailModal({ review, onClose, onDelete, onOpenImages }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold">Review Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Package className="w-4 h-4" />
              <span className="font-semibold">Product</span>
            </div>
            <div className="flex items-center gap-4">
              <img
                src={review.product?.images?.[0] || "/placeholder.png"}
                className="w-20 h-20 rounded-lg object-cover border"
                alt=""
              />
              <div>
                <h4 className="font-semibold text-lg">{review.product?.name}</h4>
                <p className="text-sm text-gray-600">ID: #{review.product?._id?.slice(-6)}</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <User className="w-4 h-4" />
              <span className="font-semibold">Reviewer</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h4 className="font-semibold">{review.user?.name}</h4>
                <p className="text-sm text-gray-600">{review.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Rating</label>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < review.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900">{review.rating}/5</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Review Comment</label>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">
                {review.comment || "No comment provided"}
              </p>
            </div>
          </div>

          {/* Images */}
          {review.images?.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                Review Images ({review.images.length})
              </label>
              <div className="grid grid-cols-4 gap-3">
                {review.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => onOpenImages(review.images, index)}
                    className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-teal-500 transition-all"
                  >
                    <img
                      src={img.url}
                      alt={`Review ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Posted On</label>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Delete this review?")) {
                onDelete();
              }
            }}
            className="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete Review
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 📁 ImageGalleryModal Component
// ============================================

function ImageGalleryModal({ images, currentIndex, onClose }) {
  const [index, setIndex] = useState(currentIndex);

  const goNext = () => setIndex((index + 1) % images.length);
  const goPrev = () => setIndex((index - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Image */}
      <div className="relative w-full max-w-4xl px-4">
        <img
          src={images[index].url}
          alt={`Image ${index + 1}`}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
        />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
          {index + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                i === index ? "border-teal-500 scale-110" : "border-transparent opacity-60"
              }`}
            >
              <img
                src={img.url}
                alt={`Thumb ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}