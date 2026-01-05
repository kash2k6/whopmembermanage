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
	configuredProductIds?: Set<string>;
}

export function ProductSelector({
	products,
	selectedProductId,
	onProductChange,
	loading = false,
	configuredProductIds = new Set(),
}: ProductSelectorProps) {
	const configuredProducts = products.filter((p) => configuredProductIds.has(p.id));
	const unconfiguredProducts = products.filter((p) => !configuredProductIds.has(p.id));

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
				{configuredProducts.length > 0 && (
					<optgroup label="Configured Products">
						{configuredProducts.map((product) => (
							<option key={product.id} value={product.id}>
								{product.title} ({product.planCount} active plans) ✓
							</option>
						))}
					</optgroup>
				)}
				{unconfiguredProducts.length > 0 && (
					<optgroup label="Other Products">
						{unconfiguredProducts.map((product) => (
							<option key={product.id} value={product.id}>
								{product.title} ({product.planCount} active plans)
							</option>
						))}
					</optgroup>
				)}
			</select>

			{configuredProducts.length > 0 && (
				<div className="mt-4 pt-4 border-t border-border">
					<p className="text-sm font-medium text-text-primary mb-2">
						Configured Products ({configuredProducts.length})
					</p>
					<div className="space-y-2">
						{configuredProducts.map((product) => (
							<button
								key={product.id}
								type="button"
								onClick={() => onProductChange(product.id)}
								className={`w-full text-left px-3 py-2 rounded-lg border transition-colors duration-fast ${
									selectedProductId === product.id
										? "bg-primary/10 border-primary text-primary"
										: "bg-background border-border text-text-primary hover:bg-background/80"
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="font-medium">{product.title}</span>
									<span className="text-xs text-text-muted">
										{product.planCount} plan{product.planCount !== 1 ? "s" : ""}
									</span>
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
