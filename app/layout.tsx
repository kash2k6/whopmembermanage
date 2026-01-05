import { WhopIframeSdkProvider, WhopThemeScript } from "@whop/react";
import { Theme } from "@whop/react/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Member Upgrade Management",
	description: "Automatically cancel lower-tier memberships when users upgrade plans",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<WhopThemeScript />
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Theme accentColor="orange">
					<WhopIframeSdkProvider>{children}</WhopIframeSdkProvider>
				</Theme>
			</body>
		</html>
	);
}
