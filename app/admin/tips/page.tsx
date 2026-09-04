import AdminFixtureManager from "@/components/admin/AdminFixtureManager";

export const metadata = {
  title: "Premium Tips Manager | Admin | BookiesMasters",
};

export const revalidate = 0;

export default async function AdminTipsPage() {
  return <AdminFixtureManager />;
}
