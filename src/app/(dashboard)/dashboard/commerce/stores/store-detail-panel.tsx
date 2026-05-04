'use client';

import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  DollarSign,
  ExternalLink,
  Settings,
  Eye,
} from 'lucide-react';
import { SlidePanel, Badge, MetricTile } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface StoreRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  currency: string;
  createdAt: string;
  _count?: { products: number; orders: number };
  totalRevenue?: number;
}

interface StoreDetailPanelProps {
  store: StoreRow | null;
  open: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
  DRAFT: 'warning',
  ARCHIVED: 'destructive',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StoreDetailPanel({ store, open, onClose }: StoreDetailPanelProps) {
  if (!store) return null;

  const products = store._count?.products ?? 0;
  const orders = store._count?.orders ?? 0;
  const revenue = store.totalRevenue ?? 0;

  return (
    <SlidePanel open={open} onClose={onClose} title={store.name} width="lg">
      <div className="space-y-6">
        {/* Header badges */}
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[store.status] ?? 'muted'} className="capitalize">
            {store.status.toLowerCase()}
          </Badge>
          <Badge variant="primary">{store.currency}</Badge>
          <span className="text-xs text-zinc-500 font-mono">{store.slug}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <MetricTile
            label="Products"
            value={products}
            icon={<Package className="h-4 w-4" />}
          />
          <MetricTile
            label="Orders"
            value={orders}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <MetricTile
            label="Revenue"
            value={fmtCurrency(revenue)}
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Quick Actions
          </p>
          <div className="grid grid-cols-1 gap-2">
            <Link
              href={`/dashboard/commerce/stores/${store.id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all"
            >
              <Settings className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium">Edit Store Settings</span>
              <ExternalLink className="ml-auto h-3 w-3 text-zinc-600" />
            </Link>
            <Link
              href={`/dashboard/commerce/stores/${store.id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all"
            >
              <Eye className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium">View Storefront</span>
              <ExternalLink className="ml-auto h-3 w-3 text-zinc-600" />
            </Link>
            <Link
              href={`/dashboard/commerce/stores/${store.id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all"
            >
              <Package className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium">Manage Products</span>
              <ExternalLink className="ml-auto h-3 w-3 text-zinc-600" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Activity
          </p>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500">
              Created {new Date(store.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {orders > 0 && (
              <p className="text-xs text-zinc-500 mt-1">
                {orders} order{orders !== 1 ? 's' : ''} processed
              </p>
            )}
            {products > 0 && (
              <p className="text-xs text-zinc-500 mt-1">
                {products} active product{products !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}
