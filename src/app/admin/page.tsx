"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  RefreshCw,
  Users,
  Clock,
  Pencil,
  X,
  Settings,
  KeyRound,
  BookOpen,
  Radio,
  Trash2,
  UserCheck,
  RotateCcw,
  Shield,
  ShieldCheck,
  CheckSquare,
  Square,
} from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { GradientBackground } from "@/components/GradientBackground";
import { RFIDManagement } from "@/components/admin/RFIDManagement";
import type { SessionPayload } from "@/utils/session";
import type { BinItem, BinItemType } from "@/app/api/admin/bin/route";

type Option = { id: string; name: string };

type Member = {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  pnr_number: string;
  status: "pending" | "approved";
  role: "member" | "admin";
  created_at?: string;
  branch: Option | null;
  year: Option | null;
  position: Option | null;
};

type SessionRow = {
  id: string;
  member_name: string;
  pnr_number: string;
  login_time: string;
  logout_time: string | null;
  logout_type: string | null;
  duration_minutes: number | null;
  work_description: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  created_at: string;
  assignee?: { id: string; name: string; pnr_number: string } | null;
};

type CalendarEventRow = {
  id: string;
  title: string;
  event_date: string;
  created_by: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [users, setUsers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventRow[]>([]);
  const [binItems, setBinItems] = useState<BinItem[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [positions, setPositions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "users" | "approvals" | "sessions" | "tasks" | "calendar" | "rfid" | "bin"
  >("users");
  const [editingUser, setEditingUser] = useState<Member | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);

  // Recycle bin states
  const [selectedBinIds, setSelectedBinIds] = useState<Set<string>>(new Set());
  const [binFilter, setBinFilter] = useState<"all" | BinItemType>("all");

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const fetchSessions = async () => {
    const res = await fetch("/api/admin/sessions");
    if (res.status === 403) {
      throw new Error("Unauthorized access. Admin privileges required.");
    }
    const data = await res.json();
    if (data.success) {
      setSessions(data.sessions);
    } else {
      throw new Error(data.error || "Failed to load sessions");
    }
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.status === 403) {
      throw new Error("Unauthorized access. Admin privileges required.");
    }
    const data = await res.json();
    if (data.success) {
      setUsers(data.users);
    } else {
      throw new Error(data.error || "Failed to load users");
    }
  };

  const fetchTasks = async () => {
    const res = await fetch("/api/admin/tasks");
    if (res.status === 403) return;
    const data = await res.json();
    if (data.success) {
      setTasks(data.tasks);
    }
  };

  const fetchCalendarEvents = async () => {
    const res = await fetch("/api/calendar");
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setCalendarEvents(data.events);
      }
    }
  };

  const fetchBin = async () => {
    try {
      const res = await fetch("/api/admin/bin");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBinItems(data.items);
        }
      }
    } catch (err) {
      console.error("Failed to fetch bin items:", err);
    }
  };

  const fetchOptions = async () => {
    const res = await fetch("/api/admin/options");
    const data = await res.json();
    if (data.success) {
      setBranches(data.branches.filter((b: Option & { is_active: boolean }) => b.is_active));
      setYears(data.years.filter((y: Option & { is_active: boolean }) => y.is_active));
      setPositions(data.positions.filter((p: Option & { is_active: boolean }) => p.is_active));
    }
  };

  const fetchSession = async () => {
    const res = await fetch("/api/session/status");
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        setSession(data.session);
      }
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([
        fetchSessions(),
        fetchUsers(),
        fetchOptions(),
        fetchSession(),
        fetchTasks(),
        fetchCalendarEvents(),
        fetchBin(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Approve a single user
  const approveUser = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: "approved" }),
      });
      if (res.ok) {
        await fetchUsers();
      } else {
        alert("Failed to approve user.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while approving user.");
    }
  };

  // Reject user (soft-delete to bin)
  const rejectUser = async (userId: string, name: string) => {
    if (!confirm(`Reject registration for "${name}" and move to Bin?`)) return;
    try {
      const res = await fetch(`/api/admin/users?user_id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        await Promise.all([fetchUsers(), fetchBin()]);
      } else {
        alert("Failed to reject user.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while rejecting user.");
    }
  };

  // Batch approve all pending users
  const approveAllPending = async () => {
    const pending = users.filter((u) => u.status === "pending");
    if (pending.length === 0) return;
    if (!confirm(`Approve all ${pending.length} pending members?`)) return;

    try {
      await Promise.all(
        pending.map((u) =>
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: u.id, status: "approved" }),
          }),
        ),
      );
      await fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Network error while approving all users.");
    }
  };

  // Promote to Admin or Demote to Member
  const toggleUserRole = async (userId: string, currentRole: "member" | "admin", name: string) => {
    const targetRole = currentRole === "admin" ? "member" : "admin";
    const promptMsg =
      targetRole === "admin"
        ? `Promote "${name}" to Admin? They will have full access to management tools and receive admin links.`
        : `Demote "${name}" back to regular Member?`;

    if (!confirm(promptMsg)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: targetRole }),
      });
      if (res.ok) {
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while updating role.");
    }
  };

  // Delete user (soft-delete to bin)
  const deleteUser = async (userId: string, name: string) => {
    if (!confirm(`Move "${name}" to the Recycle Bin? (Can be restored within 7 days)`)) return;
    try {
      const res = await fetch(`/api/admin/users?user_id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        await Promise.all([fetchUsers(), fetchBin()]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while deleting user.");
    }
  };

  // Delete session (soft-delete to bin)
  const deleteSession = async (sessionId: string) => {
    if (!confirm("Move this session log to the Recycle Bin? (Can be restored within 7 days)")) return;
    try {
      const res = await fetch(`/api/admin/sessions?session_id=${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        await Promise.all([fetchSessions(), fetchBin()]);
      } else {
        alert("Failed to delete session.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while deleting session.");
    }
  };

  const saveUserEdits = async (updates: Record<string, string>) => {
    if (!editingUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: editingUser.id, ...updates }),
      });
      if (res.ok) {
        setEditingUser(null);
        await fetchUsers();
      } else {
        alert("Failed to save changes.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while saving changes.");
    }
  };

  const assignTask = async (userId: string, description: string) => {
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee_id: userId, title: description }),
      });
      if (res.ok) {
        await fetchTasks();
      } else {
        alert("Failed to assign task.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while assigning task.");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Move this task to the Recycle Bin?")) return;
    try {
      const res = await fetch(`/api/admin/tasks?task_id=${taskId}`, { method: "DELETE" });
      if (res.ok) {
        await Promise.all([fetchTasks(), fetchBin()]);
      } else {
        alert("Failed to delete task.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while deleting task.");
    }
  };

  const addCalendarEvent = async (title: string, event_date: string) => {
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, event_date }),
      });
      if (res.ok) {
        await fetchCalendarEvents();
      } else {
        alert("Failed to create event.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while creating event.");
    }
  };

  const deleteCalendarEvent = async (eventId: string) => {
    if (!confirm("Move this calendar event to the Recycle Bin?")) return;
    try {
      const res = await fetch(`/api/admin/calendar?event_id=${eventId}`, { method: "DELETE" });
      if (res.ok) {
        await Promise.all([fetchCalendarEvents(), fetchBin()]);
      } else {
        alert("Failed to delete event.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while deleting event.");
    }
  };

  // Bin Restore Operations
  const restoreBinItems = async (items: Array<{ id: string; type: BinItemType }>) => {
    if (items.length === 0) return;
    try {
      const res = await fetch("/api/admin/bin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        setSelectedBinIds(new Set());
        await Promise.all([fetchBin(), fetchUsers(), fetchSessions(), fetchTasks(), fetchCalendarEvents()]);
      } else {
        alert("Failed to restore items.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while restoring items.");
    }
  };

  // Bin Permanent Delete Operations
  const permanentlyDeleteBinItems = async (items: Array<{ id: string; type: BinItemType }>) => {
    if (items.length === 0) return;
    if (!confirm(`Permanently delete ${items.length} item(s)? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/bin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        setSelectedBinIds(new Set());
        await fetchBin();
      } else {
        alert("Failed to permanently delete items.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while permanently deleting items.");
    }
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = <T extends Record<string, unknown>>(data: T[]): T[] => {
    return [...data].sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;

      const aValue = String(a[key] ?? "");
      const bValue = String(b[key] ?? "");

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Derived user lists
  const approvedUsers = users.filter((u) => u.status === "approved");
  const pendingUsers = users.filter((u) => u.status === "pending");

  // Filtered bin items
  const filteredBinItems = binItems.filter((item) => {
    if (binFilter === "all") return true;
    return item.type === binFilter;
  });

  const toggleSelectBinItem = (id: string) => {
    setSelectedBinIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllBin = () => {
    if (selectedBinIds.size === filteredBinItems.length && filteredBinItems.length > 0) {
      setSelectedBinIds(new Set());
    } else {
      setSelectedBinIds(new Set(filteredBinItems.map((i) => i.id)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
          <p className="text-muted font-light">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-background">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-muted">{error}</p>
        <button onClick={() => router.push("/dashboard")} className="btn-secondary mt-4 px-6 py-2 rounded-lg">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col relative overflow-hidden text-white bg-background">
      <GradientBackground />
      <Navbar session={session} title="Admin Dashboard" subtitle="Management Console" />

      {/* Tabs & Top Actions */}
      <div className="flex flex-col gap-4 mb-6 pt-24 md:pt-32">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-accent text-[color:var(--color-on-accent)]"
                  : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
              }`}
            >
              <Users className="w-4 h-4" />
              Users
              <span className="text-xs opacity-75">({approvedUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("approvals")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "approvals"
                  ? "bg-accent text-[color:var(--color-on-accent)]"
                  : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Approvals
              {pendingUsers.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === "approvals"
                      ? "bg-black/20 text-current"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {pendingUsers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("sessions")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "sessions"
                  ? "bg-accent text-[color:var(--color-on-accent)]"
                  : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
              }`}
            >
              <Clock className="w-4 h-4" />
              Sessions
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "tasks"
                  ? "bg-accent text-[color:var(--color-on-accent)]"
                  : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
              }`}
            >
              <Pencil className="w-4 h-4" />
              Tasks
            </button>

            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "calendar"
                  ? "bg-accent text-[color:var(--color-on-accent)]"
                  : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
              }`}
            >
              <Clock className="w-4 h-4" />
              Calendar
            </button>

            <button
              onClick={() => setActiveTab("rfid")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "rfid"
                  ? "bg-accent text-[color:var(--color-on-accent)]"
                  : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
              }`}
            >
              <Radio className="w-4 h-4" />
              RFID & Door
            </button>

            <button
              onClick={() => setActiveTab("bin")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "bin"
                  ? "bg-accent text-[color:var(--color-on-accent)]"
                  : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Bin
              {binItems.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === "bin"
                      ? "bg-black/20 text-current"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {binItems.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/otp")}
              className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">OTP</span>
            </button>
            <button
              onClick={() => router.push("/admin/resources")}
              className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Resources</span>
            </button>
            <button
              onClick={() => router.push("/admin/settings")}
              className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={loadData}
              className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Action Panels */}
        {activeTab === "tasks" && <AssignTaskForm users={approvedUsers} onAssign={assignTask} />}
        {activeTab === "calendar" && <AddCalendarForm onAdd={addCalendarEvent} />}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        {activeTab === "rfid" ? (
          <RFIDManagement users={approvedUsers} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-2xl overflow-hidden flex flex-col flex-1"
          >
            <div className="overflow-x-auto flex-1">
              {/* 1. USER MANAGEMENT TAB */}
              {activeTab === "users" && (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                        Name
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("email")}>
                        Email
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("pnr_number")}>
                        PNR Number
                      </th>
                      <th className="px-6 py-4 font-medium">Branch / Year</th>
                      <th className="px-6 py-4 font-medium">Position</th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("role")}>
                        Role
                      </th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {approvedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-faint bg-black/20">
                          No approved users found.
                        </td>
                      </tr>
                    ) : (
                      sortedData(approvedUsers).map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                          <td className="px-6 py-4 text-foreground">{u.email}</td>
                          <td className="px-6 py-4 text-foreground font-mono text-xs">{u.pnr_number}</td>
                          <td className="px-6 py-4 text-muted">
                            {u.branch?.name || "-"} <br />
                            <span className="text-white text-xs font-semibold">{u.year?.name || "-"}</span>
                          </td>
                          <td className="px-6 py-4 text-foreground">{u.position?.name || "-"}</td>
                          <td className="px-6 py-4">
                            {u.role === "admin" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/40">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Admin
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-muted border border-white/10">
                                Member
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {/* Promote / Demote Button */}
                              {u.role === "admin" ? (
                                <button
                                  onClick={() => toggleUserRole(u.id, "admin", u.name)}
                                  className="btn-secondary px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:text-amber-200"
                                  title="Demote to Member"
                                >
                                  Demote
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleUserRole(u.id, "member", u.name)}
                                  className="btn-secondary flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-accent hover:border-accent/40"
                                  title="Promote to Admin"
                                >
                                  <Shield className="w-3 h-3" />
                                  Make Admin
                                </button>
                              )}

                              <button
                                onClick={() => setEditingUser(u)}
                                className="btn-secondary flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>

                              <button
                                onClick={() => deleteUser(u.id, u.name)}
                                className="btn-secondary p-1.5 rounded-lg text-xs font-medium hover:border-red-500/40 text-muted hover:text-red-400"
                                title="Move to Bin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 2. APPROVALS TAB */}
              {activeTab === "approvals" && (
                <div>
                  <div className="p-6 border-b border-[color:var(--color-border)] flex flex-wrap justify-between items-center gap-4 bg-surface-2/40">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-amber-400" />
                        Pending Member Registrations
                      </h2>
                      <p className="text-xs text-muted mt-1">
                        Review new applicant registrations. Approved members gain access to the attendance portal.
                      </p>
                    </div>
                    {pendingUsers.length > 0 && (
                      <button
                        onClick={approveAllPending}
                        className="btn-primary py-2 px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        Approve All ({pendingUsers.length})
                      </button>
                    )}
                  </div>

                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-2 text-muted">
                      <tr>
                        <th className="px-6 py-4 font-medium">Applicant Name</th>
                        <th className="px-6 py-4 font-medium">Email Address</th>
                        <th className="px-6 py-4 font-medium">Phone / PNR</th>
                        <th className="px-6 py-4 font-medium">Branch / Year</th>
                        <th className="px-6 py-4 font-medium">Role Request</th>
                        <th className="px-6 py-4 font-medium text-right">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pendingUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center text-muted bg-black/10">
                            <UserCheck className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                            <p className="font-medium text-white">No pending registrations</p>
                            <p className="text-xs text-faint mt-1">All applicant submissions have been processed.</p>
                          </td>
                        </tr>
                      ) : (
                        pendingUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                            <td className="px-6 py-4 text-foreground">{u.email}</td>
                            <td className="px-6 py-4 text-muted text-xs font-mono">
                              PNR: {u.pnr_number} <br />
                              Phone: {u.phone_number || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-muted">
                              {u.branch?.name || "-"} <br />
                              <span className="text-white text-xs font-semibold">{u.year?.name || "-"}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                Pending Approval
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => approveUser(u.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => rejectUser(u.id, u.name)}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. SESSION LOGS TAB */}
              {activeTab === "sessions" && (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("login_time")}>
                        Date / Time In
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("member_name")}>
                        Member
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("logout_time")}>
                        Time Out
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("duration_minutes")}>
                        Duration
                      </th>
                      <th className="px-6 py-4 font-medium">Work Description</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-faint bg-black/20">
                          No sessions found.
                        </td>
                      </tr>
                    ) : (
                      sortedData(sessions).map((s) => (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium">{format(new Date(s.login_time), "MMM d, yyyy")}</div>
                            <div className="text-muted text-xs mt-1">{format(new Date(s.login_time), "hh:mm a")}</div>
                          </td>
                          <td className="px-6 py-4 font-medium">{s.member_name}</td>
                          <td className="px-6 py-4">
                            {s.logout_time ? (
                              <div className="flex items-center gap-2">
                                <span className="text-white">{format(new Date(s.logout_time), "hh:mm a")}</span>
                                {s.logout_type === "auto" && (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-500 font-medium">
                                    AUTO
                                  </span>
                                )}
                                {s.logout_type === "abandoned" && (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400 font-medium">
                                    ABANDONED
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-2 text-xs font-medium">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {s.duration_minutes ? (
                              <span className="bg-white/5 border border-[color:var(--color-border)] px-2 py-1 rounded text-foreground tabular-nums">
                                {s.duration_minutes} min
                              </span>
                            ) : (
                              <span className="text-faint">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 max-w-[250px] truncate text-muted" title={s.work_description || undefined}>
                            {s.work_description || <span className="text-faint">-</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => deleteSession(s.id)}
                              className="btn-secondary p-1.5 rounded-lg text-xs font-medium hover:border-red-500/40 text-muted hover:text-red-400 ml-auto"
                              title="Move Session to Bin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 4. TASKS TAB */}
              {activeTab === "tasks" && (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("created_at")}>
                        Date Assigned
                      </th>
                      <th className="px-6 py-4 font-medium">Assignee</th>
                      <th className="px-6 py-4 font-medium">Description</th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("status")}>
                        Status
                      </th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-faint bg-black/20">
                          No tasks found.
                        </td>
                      </tr>
                    ) : (
                      sortedData(tasks).map((t) => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{format(new Date(t.created_at), "MMM d, yyyy")}</td>
                          <td className="px-6 py-4 text-foreground">{t.assignee?.name || "Unknown"}</td>
                          <td className="px-6 py-4 text-muted">{t.title}</td>
                          <td className="px-6 py-4">
                            {t.status === "done" ? (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Completed
                              </span>
                            ) : t.status === "in_progress" ? (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                In Progress
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                To Do
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => deleteTask(t.id)}
                              className="btn-secondary flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ml-auto"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                              <span className="text-red-400">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 5. CALENDAR TAB */}
              {activeTab === "calendar" && (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("event_date")}>
                        Date
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("title")}>
                        Title
                      </th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {calendarEvents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-faint bg-black/20">
                          No E-Cell events scheduled.
                        </td>
                      </tr>
                    ) : (
                      sortedData(calendarEvents).map((ev) => (
                        <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{format(new Date(ev.event_date), "MMM d, yyyy")}</td>
                          <td className="px-6 py-4 text-foreground">{ev.title}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => deleteCalendarEvent(ev.id)}
                              className="btn-secondary flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ml-auto"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                              <span className="text-red-400">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 6. RECYCLE BIN TAB */}
              {activeTab === "bin" && (
                <div>
                  {/* Bin Header & Multi-action Bar */}
                  <div className="p-6 border-b border-[color:var(--color-border)] flex flex-wrap justify-between items-center gap-4 bg-surface-2/40">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-400" />
                        Recycle Bin
                      </h2>
                      <p className="text-xs text-muted">
                        Items stay here for 7 days before being automatically purged forever. You can restore items at any time.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(["all", "member", "session", "task", "calendar"] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setBinFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                            binFilter === cat
                              ? "bg-white/20 text-white font-semibold"
                              : "bg-white/5 text-muted hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Batch Action Bar */}
                  {selectedBinIds.size > 0 && (
                    <div className="px-6 py-3 bg-accent/10 border-b border-accent/20 flex flex-wrap justify-between items-center gap-3">
                      <span className="text-xs font-medium text-accent">
                        {selectedBinIds.size} item(s) selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const toRestore = binItems
                              .filter((i) => selectedBinIds.has(i.id))
                              .map((i) => ({ id: i.id, type: i.type }));
                            restoreBinItems(toRestore);
                          }}
                          className="btn-secondary py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 text-emerald-400 hover:border-emerald-500/40"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore Selected
                        </button>
                        <button
                          onClick={() => {
                            const toDelete = binItems
                              .filter((i) => selectedBinIds.has(i.id))
                              .map((i) => ({ id: i.id, type: i.type }));
                            permanentlyDeleteBinItems(toDelete);
                          }}
                          className="btn-secondary py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 text-red-400 hover:border-red-500/40"
                        >
                          <X className="w-3.5 h-3.5" />
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  )}

                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-2 text-muted">
                      <tr>
                        <th className="px-6 py-4 w-12 text-center">
                          <button onClick={toggleSelectAllBin} className="text-muted hover:text-white">
                            {filteredBinItems.length > 0 &&
                            selectedBinIds.size === filteredBinItems.length ? (
                              <CheckSquare className="w-4 h-4 text-accent" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Item Details</th>
                        <th className="px-6 py-4 font-medium">Deleted Date</th>
                        <th className="px-6 py-4 font-medium">Auto-Purge</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredBinItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center text-muted bg-black/10">
                            <Trash2 className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                            <p className="font-medium text-white">Recycle bin is empty</p>
                            <p className="text-xs text-faint mt-1">Deleted users, sessions, and tasks will appear here.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredBinItems.map((item) => {
                          const isSelected = selectedBinIds.has(item.id);
                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-white/5 transition-colors ${
                                isSelected ? "bg-white/[0.03]" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => toggleSelectBinItem(item.id)}
                                  className="text-muted hover:text-white"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-accent" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                    item.type === "member"
                                      ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                      : item.type === "session"
                                      ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                      : item.type === "task"
                                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                      : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-white">{item.title}</div>
                                <div className="text-xs text-muted mt-0.5">{item.subtitle}</div>
                              </td>
                              <td className="px-6 py-4 text-muted text-xs">
                                {format(new Date(item.deleted_at), "MMM d, yyyy")} <br />
                                <span className="text-faint">{format(new Date(item.deleted_at), "hh:mm a")}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    item.days_remaining <= 2
                                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                      : "bg-white/5 text-muted border border-white/10"
                                  }`}
                                >
                                  {item.days_remaining === 0
                                    ? "Purges today"
                                    : `${item.days_remaining} day${item.days_remaining > 1 ? "s" : ""} left`}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => restoreBinItems([{ id: item.id, type: item.type }])}
                                    className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:border-emerald-500/40"
                                    title="Restore Item"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Restore
                                  </button>
                                  <button
                                    onClick={() => permanentlyDeleteBinItems([{ id: item.id, type: item.type }])}
                                    className="btn-secondary p-1.5 rounded-lg text-xs font-medium text-muted hover:text-red-400 hover:border-red-500/40"
                                    title="Delete Permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          branches={branches}
          years={years}
          positions={positions}
          onClose={() => setEditingUser(null)}
          onSave={saveUserEdits}
        />
      )}
    </div>
  );
}

function AssignTaskForm({
  users,
  onAssign,
}: {
  users: Member[];
  onAssign: (userId: string, description: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [description, setDescription] = useState("");
  const [assigning, setAssigning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !description) return;
    setAssigning(true);
    await onAssign(userId, description);
    setDescription("");
    setAssigning(false);
  };

  return (
    <div className="glass-card rounded-xl p-6 max-w-2xl">
      <h3 className="text-lg font-bold mb-4">Assign New Task</h3>
      <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-muted">Assignee</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="field w-full rounded-xl px-4 py-2.5"
          >
            <option value="">Select Member...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.pnr_number})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 flex-[2] min-w-[300px]">
          <label className="text-sm font-medium text-muted">Task Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="E.g., Complete UI mockups"
            className="field w-full rounded-xl px-4 py-2.5"
          />
        </div>
        <button
          type="submit"
          disabled={assigning || !userId || !description}
          className="btn-primary py-2.5 px-6 rounded-xl disabled:opacity-60 whitespace-nowrap h-[44px]"
        >
          {assigning ? "Assigning..." : "Assign Task"}
        </button>
      </form>
    </div>
  );
}

function AddCalendarForm({ onAdd }: { onAdd: (title: string, event_date: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate) return;
    setAdding(true);
    await onAdd(title, eventDate);
    setTitle("");
    setEventDate("");
    setAdding(false);
  };

  return (
    <div className="glass-card rounded-xl p-6 max-w-2xl">
      <h3 className="text-lg font-bold mb-4">Add E-Cell Event</h3>
      <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-muted">Event Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="E.g., Ideathon 2026"
            className="field w-full rounded-xl px-4 py-2.5"
          />
        </div>
        <div className="space-y-2 flex-1 min-w-[150px]">
          <label className="text-sm font-medium text-muted">Event Date</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="field w-full rounded-xl px-4 py-2.5"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !title || !eventDate}
          className="btn-primary py-2.5 px-6 rounded-xl disabled:opacity-60 whitespace-nowrap h-[44px]"
        >
          {adding ? "Adding..." : "Add Event"}
        </button>
      </form>
    </div>
  );
}

function EditUserModal({
  user,
  branches,
  years,
  positions,
  onClose,
  onSave,
}: {
  user: Member;
  branches: Option[];
  years: Option[];
  positions: Option[];
  onClose: () => void;
  onSave: (updates: Record<string, string>) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [pnrNumber, setPnrNumber] = useState(user.pnr_number);
  const [branchId, setBranchId] = useState(user.branch?.id || "");
  const [yearId, setYearId] = useState(user.year?.id || "");
  const [positionId, setPositionId] = useState(user.position?.id || "");
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name,
      pnr_number: pnrNumber,
      branch_id: branchId,
      year_id: yearId,
      position_id: positionId,
      role,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
        className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-[color:var(--color-border)] flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Edit Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="field w-full rounded-xl px-4 py-2.5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">PNR Number</label>
            <input
              value={pnrNumber}
              onChange={(e) => setPnrNumber(e.target.value)}
              required
              className="field w-full rounded-xl px-4 py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="field w-full rounded-xl px-4 py-2.5"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Year</label>
              <select
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
                required
                className="field w-full rounded-xl px-4 py-2.5"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Position</label>
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                required
                className="field w-full rounded-xl px-4 py-2.5"
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "member" | "admin")}
                className="field w-full rounded-xl px-4 py-2.5"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 px-4 rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 px-4 rounded-xl disabled:opacity-60">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
