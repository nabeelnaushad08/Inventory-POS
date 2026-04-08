import { createClient } from "@/lib/supabase/server"
import { UsersClient } from "@/components/users/users-client"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single()

  if (currentProfile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return <UsersClient users={users ?? []} currentUserId={user!.id} />
}
