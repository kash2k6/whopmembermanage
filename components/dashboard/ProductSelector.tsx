"use client";

import { useEffect, useState } from "react";

interface Product {
	id: string;
	title: string;
	planCount: number;
}

interface ProductSelectorProps {
	products: Product[];
	selectedProductId: string | null;
	onProductChange: (productId: string) => void;
	loading?: boolean;
}

export function ProductSelector({
	products,
	selectedProductId,
	onProductChange,
	loading = false,
}: ProductSelectorProps) {
	return (
		<div className="bg-surface rounded-lg p-6 shadow-subtle">
			<label
				htmlFor="product-select"
				className="block text-sm font-medium text-text-primary mb-3"
			>
				Select Product
			</label>
			<select
				id="product-select"
				value={selectedProductId || ""}
				onChange={(e) => onProductChange(e.target.value)}
				disabled={loading || products.length === 0}
				className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<option value="">{loading ? "Loading..." : "Choose a product..."}</option>
				{products.map((product) => (
					<option key={product.id} value={product.id}>
						{product.title} ({product.planCount} active plans)
					</option>
				))}
			</select>
		</div>
	);
}
