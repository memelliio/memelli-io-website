'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Edit2, ImageIcon, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Badge } from '../../../../../components/ui/badge';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inventory: number;
  sku?: string;
  attributes: Record<string, any>;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  type: string;
  basePrice: number;
  comparePrice?: number;
  sku?: string;
  inventory: number;
  status: string;
  imageUrls: string[];
  storeId: string;
  store?: { id: string; name: string };
  variants: ProductVariant[];
  _count?: { orderItems: number };
  createdAt: string;
}

interface ProductDetailPanelProps {
  product: Product;
  onClose: () => void;
  onUpdated?: () => void;
}

const statusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'muted',
  OUT_OF_STOCK: 'destructive',
};

export default function ProductDetailPanel({ product, onClose, onUpdated }: ProductDetailPanelProps) {
  const api = useApi();
  const [editing, setEditing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editData, setEditData] = useState({
    name: product.name,
    description: product.description ?? '',
    basePrice: product.basePrice,
    inventory: product.inventory,
    status: product.status,
  });
  const [saving, setSaving] = useState(false);

  const images = product.imageUrls ?? [];

  const handleSave = async () => {
    setSaving(true);
    const res = await api.patch(`/api/commerce/products/${product.id}`, editData);
    setSaving(false);
    if (!res.error) {
      setEditing(false);
      onUpdated?.();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-100 truncate">{product.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Image Gallery */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {images.length > 0 ? (
              <div className="relative">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="h-64 w-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            i === currentImageIndex ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center bg-zinc-800">
                <ImageIcon className="h-12 w-12 text-zinc-600" />
              </div>
            )}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === currentImageIndex ? 'border-red-500' : 'border-zinc-700'
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          {editing ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.basePrice}
                    onChange={(e) => setEditData({ ...editData, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Stock</label>
                  <input
                    type="number"
                    value={editData.inventory}
                    onChange={(e) => setEditData({ ...editData, inventory: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusVariant[product.status] ?? 'muted'} className="capitalize">
                  {product.status.toLowerCase()}
                </Badge>
                <Badge variant="primary">{product.type}</Badge>
                {product.store && (
                  <Link
                    href={`/dashboard/commerce/stores/${product.storeId}`}
                    className="text-xs text-red-400 hover:underline"
                  >
                    {product.store.name}
                  </Link>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-zinc-400 leading-relaxed">{product.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <p className="text-xs text-zinc-500 mb-1">Price</p>
                  <p className="text-lg font-semibold text-zinc-100">${product.basePrice.toFixed(2)}</p>
                  {product.comparePrice && product.comparePrice > product.basePrice && (
                    <p className="text-xs text-zinc-500 line-through">${product.comparePrice.toFixed(2)}</p>
                  )}
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <p className="text-xs text-zinc-500 mb-1">Stock</p>
                  <p className={`text-lg font-semibold ${product.inventory <= 0 ? 'text-red-400' : product.inventory <= 10 ? 'text-yellow-400' : 'text-zinc-100'}`}>
                    {product.inventory}
                  </p>
                  {product.sku && <p className="text-xs text-zinc-500 font-mono">{product.sku}</p>}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs text-zinc-500 mb-1">Orders</p>
                <p className="text-lg font-semibold text-zinc-100">{product._count?.orderItems ?? 0}</p>
              </div>
            </div>
          )}

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                <Package className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Variants ({product.variants.length})
                </h3>
              </div>
              <div className="divide-y divide-zinc-800">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{variant.name}</p>
                      {variant.sku && (
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">{variant.sku}</p>
                      )}
                      {Object.keys(variant.attributes).length > 0 && (
                        <div className="flex gap-1.5 mt-1">
                          {Object.entries(variant.attributes).map(([key, val]) => (
                            <span key={key} className="text-xs text-zinc-500 bg-zinc-800 rounded px-1.5 py-0.5">
                              {key}: {String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-100">${variant.price.toFixed(2)}</p>
                      <p className={`text-xs ${variant.inventory <= 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                        {variant.inventory} in stock
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-zinc-600 pt-2">
            Created {new Date(product.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </>
  );
}
