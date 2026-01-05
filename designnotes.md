🎯 Product UX Goal (Important Context for Cursor)

This app should feel like:

“I install it”

“I define upgrade & downgrade rules once”

“I never think about double-charges again”

No funnels.
No automations builder.
No confusion.

🎨 Design System (Cursor must follow this strictly)
Theme

Primary: Warm orange #FF7A1A

Accent: Soft amber #FFB26B

Background: Near-white #FAFAFA

Surface: White #FFFFFF

Border: Light gray #EDEDED

Text (Primary): Charcoal #1F2937

Text (Muted): #6B7280

Style Rules

No heavy gradients

No neon glow

No card overload

Rounded corners: 12px

Subtle shadow only:

box-shadow: 0 8px 24px rgba(0,0,0,0.04)


Animation: 150–200ms ease, micro-interactions only

🧭 App Structure (Single Dashboard View)
Navigation

No sidebar

Single-page dashboard

Top header only

1️⃣ Dashboard Intro / Hero (Top Section)

Purpose: Explain value instantly + show status

Layout

Full-width container

White background

Left aligned text

Right side = status badge

Copy (use this verbatim)

Title

Automatic Membership Upgrade Protection

Subtext

Prevent double-charging when members upgrade plans.
When a higher plan is purchased, the lower plan is automatically canceled.

Status Badge

🟢 “Active & Monitoring”

⚪ “Setup Required” (if no rules exist)

Design Notes

Orange underline under the word Upgrade

No illustrations

No icons except small status dot

2️⃣ Product Selection Section

Purpose: Select which product you’re configuring rules for

Layout

Card container

Dropdown select

UI

Label

Select Product

Dropdown

Pull from Whop list-products

Show:

Product title

Small tag: “X active plans”

Behavior

Selecting a product loads:

Its plans

Existing rules (if any)

3️⃣ Upgrade & Downgrade Rules (CORE SETUP)

This is the only real setup.

Layout

Two-column grid

Left: Upgrade Rules

Right: Downgrade Rules

🔼 Upgrade Rules Panel

Title

What counts as an upgrade?

Description

If a member purchases one of these plans, their previous plan will be canceled automatically.

Rule Builder UI

Each plan shown as a row

Columns:

Plan Name

Price

Toggle: “Higher than”

Example

[ Pro Plan ]   $49/mo   ✅ Higher than Starter
[ Elite Plan ] $99/mo   ✅ Higher than Pro


Logic (internal, no UI complexity)

Higher price = upgrade (default)

User can override via toggle

🔽 Downgrade Rules Panel

Title

What counts as a downgrade?

Description

If a member switches to a lower plan, keep the current plan active.

Rule Builder UI

Same plans

Toggle: “Allow downgrade without cancel”

Example

[ Starter Plan ] $19/mo  ✅ Allow
[ Pro Plan ]     $49/mo  ❌ Do not auto-cancel


Important

Downgrades NEVER auto-cancel by default

User must explicitly allow behavior

4️⃣ Save Configuration (Sticky Footer)

Layout

Sticky bottom bar

White with top border

Buttons

Primary (Orange): Save Rules

Secondary (Text): Reset

Micro-copy

Changes apply immediately to new upgrades.

5️⃣ Activity Preview (Read-Only)

Purpose: Confidence, not analytics overload

Card

Title

Recent Upgrade Actions

Rows

User ID (shortened)

Old Plan → New Plan

Status: “Canceled automatically”

Timestamp

Limit to 5 rows max

🧠 UX RULES (Very Important)

Cursor must follow these:

❌ No funnels

❌ No automation builders

❌ No complex conditions

❌ No nested modals

✅ One product at a time

✅ Price-based logic first

✅ Override via toggles only