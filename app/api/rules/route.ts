import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const companyId = searchParams.get("companyId");
		const productId = searchParams.get("productId");

		if (!companyId || !productId) {
			return NextResponse.json(
				{ error: "companyId and productId are required" },
				{ status: 400 },
			);
		}

		if (!supabaseAdmin) {
			return NextResponse.json(
				{ error: "Database not configured" },
				{ status: 500 },
			);
		}

		// Fetch product config (new simplified structure) - scoped to company
		const { data: config, error: configError } = await supabaseAdmin
			.from("product_configs")
			.select("*")
			.eq("company_id", companyId)
			.eq("product_id", productId)
			.single();

		console.log("Fetching config for product:", productId);
		console.log("Config data:", config);
		console.log("Config error:", configError);

		// PGRST116 is "not found" - that's okay, we'll use defaults
		if (configError && configError.code !== "PGRST116") {
			console.error("Error fetching product config:", configError);
			return NextResponse.json(
				{ error: "Failed to fetch configuration", details: configError.message },
				{ status: 500 },
			);
		}

		// If no config exists, return defaults
		if (!config) {
			console.log("No config found, returning defaults");
			return NextResponse.json({
				enabled: true, // Default to enabled
				advancedRules: {
					ignoreFreePlans: false,
					treatSamePriceAsUpgrade: false,
					allowDowngradeToCancel: true, // Default ON - prevents double-charging
				},
			});
		}

		// Return saved configuration
		console.log("Returning saved config:", {
			enabled: config.enabled,
			ignoreFreePlans: config.ignore_free_plans,
			treatSamePriceAsUpgrade: config.treat_same_price_as_upgrade,
			allowDowngradeToCancel: config.allow_downgrade_to_cancel,
		});

		return NextResponse.json({
			enabled: config.enabled ?? true,
			advancedRules: {
				ignoreFreePlans: config.ignore_free_plans ?? false,
				treatSamePriceAsUpgrade: config.treat_same_price_as_upgrade ?? false,
				allowDowngradeToCancel: config.allow_downgrade_to_cancel ?? true,
			},
		});
	} catch (error) {
		console.error("Error fetching rules:", error);
		return NextResponse.json(
			{ error: "Failed to fetch rules" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { companyId, productId, enabled, advancedRules } = body;

		if (!companyId || !productId) {
			return NextResponse.json(
				{ error: "companyId and productId are required" },
				{ status: 400 },
			);
		}

		if (!supabaseAdmin) {
			return NextResponse.json(
				{ error: "Database not configured" },
				{ status: 500 },
			);
		}

		// Check if config exists - scoped to company
		const { data: existingConfig } = await supabaseAdmin
			.from("product_configs")
			.select("*")
			.eq("company_id", companyId)
			.eq("product_id", productId)
			.single();

		const configData = {
			company_id: companyId,
			product_id: productId,
			cancellation_timing: "period_end",
			enabled: enabled ?? true,
			ignore_free_plans: advancedRules?.ignoreFreePlans ?? false,
			treat_same_price_as_upgrade: advancedRules?.treatSamePriceAsUpgrade ?? false,
			allow_downgrade_to_cancel: advancedRules?.allowDowngradeToCancel ?? true, // Default ON
		};

		if (!existingConfig || existingConfig.code === "PGRST116") {
			// Insert new config
			const { error: insertError } = await supabaseAdmin
				.from("product_configs")
				.insert(configData);

			if (insertError) {
				console.error("Error inserting product config:", insertError);
				return NextResponse.json(
					{ error: "Failed to save configuration" },
					{ status: 500 },
				);
			}
		} else {
			// Update existing config - scoped to company
			const { error: updateError } = await supabaseAdmin
				.from("product_configs")
				.update(configData)
				.eq("company_id", companyId)
				.eq("product_id", productId);

			if (updateError) {
				console.error("Error updating product config:", updateError);
				return NextResponse.json(
					{ error: "Failed to save configuration" },
					{ status: 500 },
				);
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving rules:", error);
		return NextResponse.json(
			{ error: "Failed to save rules" },
			{ status: 500 },
		);
	}
}
