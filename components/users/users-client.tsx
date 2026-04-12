"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { Plus, Edit, Shield, Users, UserCheck, Loader2 } from "lucide-react"
import type { Profile, UserRole } from "@/types"

interface UsersClientProps {
  users: Profile[]
  currentUserId: string
}

const roleConfig = {
  admin: { label: "Admin", variant: "default" as const, color: "bg-purple-100 text-purple-800", icon: Shield },
  manager: { label: "Manager", variant: "secondary" as const, color: "bg-blue-100 text-blue-800", icon: UserCheck },
  cashier: { label: "Cashier", variant: "outline" as const, color: "bg-green-100 text-green-800", icon: Users },
}

export function UsersClient({ users: initial, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState(initial)
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>("cashier")
  const [invitePassword, setInvitePassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleToggleActive = async (user: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !user.is_active })
      .eq("id", user.id)
    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      toast({
        title: user.is_active ? "User deactivated" : "User activated",
        description: `${user.name} has been ${user.is_active ? "deactivated" : "activated"}.`,
      })
    }
  }

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)
    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
      setEditUser(null)
      toast({ title: "Role updated", description: "User role has been changed." })
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteName || !invitePassword) return
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: inviteEmail,
        password: invitePassword,
        options: {
          data: { name: inviteName, role: inviteRole },
        },
      })

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        toast({
          title: "User invited",
          description: `${inviteName} has been sent a confirmation email.`,
        })
        setShowInvite(false)
        setInviteEmail("")
        setInviteName("")
        setInvitePassword("")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    cashiers: users.filter((u) => u.role === "cashier").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage staff accounts and permissions</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active", value: stats.active, color: "text-green-600", bg: "bg-green-50" },
          { label: "Admins", value: stats.admins, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Cashiers", value: stats.cashiers, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <p className="text-xs font-medium text-gray-600">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Joined</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => {
              const role = roleConfig[user.role]
              const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              const isCurrent = user.id === currentUserId

              return (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {user.name}
                          {isCurrent && (
                            <span className="ml-1.5 text-xs text-primary font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${role.color}`}>
                      {role.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center hidden md:table-cell">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => !isCurrent && handleToggleActive(user)}
                      disabled={isCurrent}
                    />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 hidden lg:table-cell">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditUser(user)}
                      disabled={isCurrent}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Role Modal */}
      {editUser && (
        <Dialog open onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {editUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{editUser.name}</p>
                  <p className="text-xs text-muted-foreground">{editUser.email}</p>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Role</Label>
                <Select
                  defaultValue={editUser.role}
                  onValueChange={(v) => handleUpdateRole(editUser.id, v as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — Full access</SelectItem>
                    <SelectItem value="manager">Manager — Inventory + Reports</SelectItem>
                    <SelectItem value="cashier">Cashier — POS only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite User Modal */}
      {showInvite && (
        <Dialog open onOpenChange={() => setShowInvite(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Email</Label>
                <Input
                  type="email"
                  placeholder="john@yourstore.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Password</Label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button onClick={handleInviteUser} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
