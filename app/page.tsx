import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // ensure fresh render

export default function Home() {
  // Force Kenya timezone reliably using robust calculation
  // Intl.DateTimeFormat can sometimes fail in specific server environments if locales are missing

  const now = new Date();

  // Create a date object shifted to Nairobi time
  const offset = 3; // Nairobi is UTC+3
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const nairobiTime = new Date(utc + (3600000 * offset));

  // Format as YYYY-MM-DD manually
  const year = nairobiTime.getFullYear();
  const month = String(nairobiTime.getMonth() + 1).padStart(2, '0');
  const day = String(nairobiTime.getDate()).padStart(2, '0');
  const kenyaTime = `${year}-${month}-${day}`;

  redirect(`/predictions/${kenyaTime}`);
}
