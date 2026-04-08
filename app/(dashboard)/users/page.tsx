import { createClient } from "@/lib/supabase/server"
import { UsersClient } from "@/components/users/users-client"
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

export default async function UsersPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  const currentProfile = profileRaw as { role: string } | null

  if (currentProfile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: usersRaw } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
  const users = (usersRaw ?? []) as ProfileRow[]

  return <UsersClient users={users} currentUserId={user.id} />
}
