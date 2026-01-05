import { redirect } from "next/navigation";

export default function HomePage() {
	// Redirect to a default company or show a message
	// In a real app, you'd get the company ID from the Whop context
	redirect("/dashboard/default");
}
