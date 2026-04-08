import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

type ProfileRow = {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "cashier"
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const profile = profileRaw as ProfileRow | null

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={profile?.role ?? "cashier"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={profile} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
