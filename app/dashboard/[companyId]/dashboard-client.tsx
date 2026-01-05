"use client";

import { useState, useEffect, useCallback } from "react";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { ProductSelector } from "@/components/dashboard/ProductSelector";
import { UpgradeBehavior } from "@/components/dashboard/UpgradeBehavior";
import { StickyFooter } from "@/components/dashboard/StickyFooter";
import { ActivityPreview } from "@/components/dashboard/ActivityPreview";
import { AccessWarningBanner } from "@/components/dashboard/AccessWarningBanner";

interface Product {
	id: string;
	title: string;
	planCount: number;
}

interface Plan {
	id: string;
	title: string;
	renewal_price: number;
	initial_price: number;
}

interface AdvancedRules {
	ignoreFreePlans: boolean;
	treatSamePriceAsUpgrade: boolean;
	allowDowngradeToCancel: boolean;
}

interface ActivityLog {
	id: string;
	user_id: string;
	old_plan_name: string | null;
	new_plan_name: string;
	status: string;
	created_at: string;
}

export function DashboardClient({
	companyId,
	hasAppAccess = false,
}: {
	companyId: string;
	hasAppAccess?: boolean;
}) {
	const [products, setProducts] = useState<Product[]>([]);
	const [configuredProductIds, setConfiguredProductIds] = useState<Set<string>>(new Set());
	const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [enabled, setEnabled] = useState(true);
	const [advancedRules, setAdvancedRules] = useState<AdvancedRules>({
		ignoreFreePlans: false,
		treatSamePriceAsUpgrade: false,
		allowDowngradeToCancel: true, // Default ON - prevents double-charging on downgrades
	});
	const [activities, setActivities] = useState<ActivityLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [initialState, setInitialState] = useState<{
		enabled: boolean;
		advancedRules: AdvancedRules;
	}>({
		enabled: true,
		advancedRules: {
			ignoreFreePlans: false,
			treatSamePriceAsUpgrade: false,
			allowDowngradeToCancel: true, // Default ON
		},
	});

	// Fetch products on mount
	useEffect(() => {
		fetchProducts();
		fetchActivities();
		fetchConfiguredProducts();
	}, [companyId]);

	// Fetch configured products when config is saved
	const fetchConfiguredProducts = async () => {
		try {
			const response = await fetch(`/api/configs?companyId=${companyId}`);
			if (!response.ok) throw new Error("Failed to fetch configured products");
			const data = await response.json();
			setConfiguredProductIds(new Set(data.configuredProductIds || []));
		} catch (error) {
			console.error("Error fetching configured products:", error);
		}
	};

	// Fetch plans and rules when product is selected
	useEffect(() => {
		console.log("Product selection changed:", selectedProductId);
		if (selectedProductId) {
			console.log("Fetching plans and rules for product:", selectedProductId);
			fetchPlans(selectedProductId);
			fetchRules(selectedProductId);
		} else {
			console.log("No product selected, resetting to defaults");
			setPlans([]);
			setEnabled(true);
			setAdvancedRules({
				ignoreFreePlans: false,
				treatSamePriceAsUpgrade: false,
				allowDowngradeToCancel: true, // Default ON
			});
		}
	}, [selectedProductId, companyId]);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/products?companyId=${companyId}`);
			if (!response.ok) throw new Error("Failed to fetch products");
			const data = await response.json();
			const productsList = data.products || [];
			console.log("Fetched products:", productsList);
			setProducts(productsList);
			
			// Auto-select first product if none selected and products exist
			if (!selectedProductId && productsList.length > 0) {
				console.log("Auto-selecting first product:", productsList[0].id);
				setSelectedProductId(productsList[0].id);
			}
		} catch (error) {
			console.error("Error fetching products:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchPlans = async (productId: string) => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/plans?companyId=${companyId}&productId=${productId}`,
			);
			if (!response.ok) throw new Error("Failed to fetch plans");
			const data = await response.json();
			setPlans(data.plans || []);
		} catch (error) {
			console.error("Error fetching plans:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchRules = async (productId: string) => {
		try {
			console.log("Fetching rules for product:", productId);
			const response = await fetch(
				`/api/rules?companyId=${companyId}&productId=${productId}`,
			);
			if (!response.ok) throw new Error("Failed to fetch rules");
			const data = await response.json();
			console.log("Loaded configuration response:", data);
			
			// Check if there's an error in the response
			if (data.error) {
				console.error("API returned error:", data.error);
				throw new Error(data.error);
			}
			
			const loadedEnabled = data.enabled ?? true;
			const loadedAdvancedRules = data.advancedRules || {
				ignoreFreePlans: false,
				treatSamePriceAsUpgrade: false,
				allowDowngradeToCancel: true, // Default ON
			};
			
			console.log("Setting state with:", {
				enabled: loadedEnabled,
				advancedRules: loadedAdvancedRules,
			});
			
			setEnabled(loadedEnabled);
			setAdvancedRules(loadedAdvancedRules);
			setInitialState({
				enabled: loadedEnabled,
				advancedRules: loadedAdvancedRules,
			});
			setHasChanges(false);
			console.log("Configuration loaded and state updated successfully");
		} catch (error) {
			console.error("Error fetching rules:", error);
			// Set defaults on error
			setEnabled(true);
			setAdvancedRules({
				ignoreFreePlans: false,
				treatSamePriceAsUpgrade: false,
				allowDowngradeToCancel: true,
			});
		}
	};

	const fetchActivities = async () => {
		try {
			const response = await fetch(`/api/activity?companyId=${companyId}`);
			if (!response.ok) throw new Error("Failed to fetch activities");
			const data = await response.json();
			setActivities(data.activities || []);
		} catch (error) {
			console.error("Error fetching activities:", error);
		}
	};

	const handleUpgradeBehaviorChange = useCallback(
		(newEnabled: boolean, newAdvancedRules: AdvancedRules) => {
			setEnabled(newEnabled);
			setAdvancedRules(newAdvancedRules);

			// Check if state has changed
			const enabledChanged = newEnabled !== initialState.enabled;
			const advancedChanged =
				JSON.stringify(newAdvancedRules) !== JSON.stringify(initialState.advancedRules);
			setHasChanges(enabledChanged || advancedChanged);
		},
		[initialState],
	);

	const handleSave = async () => {
		console.log("Save clicked", { selectedProductId, enabled, advancedRules });
		
		// Check access before allowing save
		if (!hasAppAccess) {
			alert("Premium subscription required. Please subscribe to use this feature.");
			return;
		}
		
		if (!selectedProductId) {
			alert("Please select a product first");
			return;
		}

		try {
			setSaving(true);
			console.log("Saving configuration...", {
				companyId,
				productId: selectedProductId,
				enabled,
				advancedRules,
			});

			const response = await fetch(`/api/rules`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					productId: selectedProductId,
					enabled,
					advancedRules,
				}),
			});

			const responseData = await response.json();
			console.log("Save response:", { status: response.status, data: responseData });

			if (!response.ok) {
				throw new Error(responseData.error || "Failed to save configuration");
			}

			// Update initial state to reflect saved state
			setInitialState({ enabled, advancedRules });
			setHasChanges(false);
			setSaveSuccess(true);
			console.log("Configuration saved successfully");
			
			// Refresh configured products list
			fetchConfiguredProducts();
			
			// Hide success message after 3 seconds
			setTimeout(() => setSaveSuccess(false), 3000);
		} catch (error) {
			console.error("Error saving configuration:", error);
			alert(`Failed to save configuration: ${error instanceof Error ? error.message : "Unknown error"}`);
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		setEnabled(initialState.enabled);
		setAdvancedRules(initialState.advancedRules);
		setHasChanges(false);
	};

	// Re-check access after purchase
	const recheckAccess = useCallback(async () => {
		try {
			const response = await fetch("/api/access/check");
			if (response.ok) {
				const data = await response.json();
				if (data.hasAccess) {
					// Refresh the page to reload with access
					window.location.reload();
				}
			}
		} catch (error) {
			console.error("Error rechecking access:", error);
		}
	}, []);

	const hasRules = enabled;

	// Debug log
	console.log("DashboardClient render - hasAppAccess:", hasAppAccess);
	console.log("Will show banner:", !hasAppAccess);

	return (
		<div className="min-h-screen bg-background pb-24 relative">
			<div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-0">
				<HeroSection hasRules={hasRules} />

				{!hasAppAccess && (
					<div>
						<AccessWarningBanner onPurchaseSuccess={recheckAccess} />
					</div>
				)}

				<ProductSelector
					products={products}
					selectedProductId={selectedProductId}
					onProductChange={setSelectedProductId}
					loading={loading}
					configuredProductIds={configuredProductIds}
				/>

				{selectedProductId && (
					<UpgradeBehavior
						plans={plans}
						enabled={enabled}
						advancedRules={advancedRules}
						onChange={handleUpgradeBehaviorChange}
					/>
				)}

				<ActivityPreview activities={activities} loading={loading} />
			</div>

			<StickyFooter
				onSave={handleSave}
				onReset={handleReset}
				saving={saving}
				hasChanges={hasChanges}
				saveSuccess={saveSuccess}
			/>
		</div>
	);
}
