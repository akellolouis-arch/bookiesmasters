import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TipsIndex() {
  const now = new Date();
  const offset = 3; 
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const nairobiTime = new Date(utc + (3600000 * offset));

  const year = nairobiTime.getFullYear();
  const month = String(nairobiTime.getMonth() + 1).padStart(2, '0');
  const day = String(nairobiTime.getDate()).padStart(2, '0');
  const kenyaTime = `${year}-${month}-${day}`;

  redirect(`/tips/${kenyaTime}`);
}
