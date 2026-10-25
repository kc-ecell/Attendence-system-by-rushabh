"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  Zap,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  CreditCard,
  Radio,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  Link as LinkIcon,
  X,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";

export type MemberOption = {
  id: string;
  name: string;
  pnr_number: string;
  email: string;
};

type CardInfo = {
  uid: string;
  active: boolean;
};

type PersonRow = {
  id: string;
  member_id: string | null;
  full_name: string;
  class_name: string;
  division: string;
  academic_year: string;
  role: "member" | "admin";
  access_enabled: boolean;
  notes: string;
  created_at: string;
  card: CardInfo | null;
  member: MemberOption | null;
};

type DoorInfo = {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  override_mode: boolean;
  override_expires_at: string | null;
  unlock_window_ms: number;
};

type PendingEnrollment = {
  id: string;
  status: "requested" | "awaiting_card" | string;
  expires_at: string;
  person_id: string;
  people?: { full_name: string } | { full_name: string }[];
};

type AccessEventRow = {
  id: number;
  created_at: string;
  decision: string;
  reason: string;
  uid: string | null;
  offline: boolean;
  person_name: string;
  device_name: string;
};

interface RFIDManagementProps {
  users?: MemberOption[];
}

export function RFIDManagement({ users = [] }: RFIDManagementProps) {
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [doors, setDoors] = useState<DoorInfo[]>([]);
  const [events, setEvents] = useState<AccessEventRow[]>([]);
  const [pendingEnrollment, setPendingEnrollment] = useState<PendingEnrollment | null>(null);
  const [stats, setStats] = useState({
    registeredPeople: 0,
    accessEnabled: 0,
    cardsAssigned: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ text: string; error?: boolean } | null>(null);

  // Door controls state
  const [unlocking, setUnlocking] = useState(false);
  const [unlockCooldown, setUnlockCooldown] = useState(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "member" | "admin">("all");

  // Form State (Add / Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formDivision, setFormDivision] = useState("");
  const [formYear, setFormYear] = useState("");
  const [formRole, setFormRole] = useState<"member" | "admin">("member");
  const [formUid, setFormUid] = useState("");
  const [formMemberId, setFormMemberId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submittingForm, setSubmittingForm] = useState(false);

  const showNotice = useCallback((text: string, error = false) => {
    setNotification({ text, error });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 5000);
  }, []);

  // Fetch Overview Data
  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rfid/overview");
      if (!res.ok) throw new Error("Failed to load RFID overview");
      const data = await res.json();
      if (data.success) {
        setDoors(data.doors || []);
        setPendingEnrollment(data.pendingEnrollment || null);
        setEvents(data.events || []);
        setStats(data.stats || { registeredPeople: 0, accessEnabled: 0, cardsAssigned: 0 });
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  // Fetch People Data
  const loadPeople = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rfid/people");
      if (!res.ok) throw new Error("Failed to load people");
      const data = await res.json();
      if (data.success) {
        setPeople(data.people || []);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadOverview(), loadPeople()]);
    setRefreshing(false);
  }, [loadOverview, loadPeople]);

  useEffect(() => {
    Promise.all([loadOverview(), loadPeople()]).finally(() => setLoading(false));
  }, [loadOverview, loadPeople]);

  // Supabase Realtime Listener for Live Door Scans and Enrollment
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const channel = supabase
      .channel("rfid-admin-live-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "access_events" },
        (payload) => {
          const newEvt = payload.new as {
            id: number;
            created_at: string;
            decision: string;
            reason: string;
            uid: string | null;
            offline: boolean;
            person_id: string | null;
          };

          // Find person name if possible
          const matchedPerson = people.find((p) => p.id === newEvt.person_id);
          const formattedEvt: AccessEventRow = {
            id: newEvt.id,
            created_at: newEvt.created_at,
            decision: newEvt.decision,
            reason: newEvt.reason,
            uid: newEvt.uid,
            offline: Boolean(newEvt.offline),
            person_name: matchedPerson ? matchedPerson.full_name : "Card Tap",
            device_name: "Door Controller",
          };

          setEvents((prev) => [formattedEvt, ...prev.slice(0, 29)]);
          // Also refresh stats
          loadOverview();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "enrollment_requests" },
        () => {
          loadOverview();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doors" },
        () => {
          loadOverview();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOverview, people]);

  // Primary Door
  const primaryDoor = useMemo(() => doors[0] || null, [doors]);
  const isOverrideActive = Boolean(
    primaryDoor?.override_mode &&
      primaryDoor?.override_expires_at &&
      new Date(primaryDoor.override_expires_at) > new Date()
  );

  // Trigger Remote Unlock
  const handleRemoteUnlock = async () => {
    if (!primaryDoor || unlocking || unlockCooldown > 0) return;
    setUnlocking(true);
    try {
      const res = await fetch("/api/admin/rfid/doors/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ door_id: primaryDoor.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger unlock");

      showNotice("Door unlock command sent! Lock strike will engage.");
      setUnlockCooldown(10);
      const interval = setInterval(() => {
        setUnlockCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Unlock failed", true);
    } finally {
      setUnlocking(false);
    }
  };

  // Toggle Any-Card Mode Override
  const handleToggleOverride = async () => {
    if (!primaryDoor) return;
    try {
      const nextMode = !isOverrideActive;
      const res = await fetch("/api/admin/rfid/doors/override", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ door_id: primaryDoor.id, enabled: nextMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update override mode");

      showNotice(
        nextMode
          ? "Any-Card Mode enabled (auto-expires in 2 hours)."
          : "Any-Card Mode disabled. Standard allow-list restored."
      );
      loadOverview();
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Override update failed", true);
    }
  };

  // Start Card Enrollment
  const handleEnrollCard = async (personId: string) => {
    if (!primaryDoor) return;
    try {
      const res = await fetch("/api/admin/rfid/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: personId, door_id: primaryDoor.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enrollment initiation failed");

      showNotice("Enrollment started. Tap your admin supervisor badge at the door first.");
      loadOverview();
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Enrollment failed", true);
    }
  };

  // Cancel Enrollment
  const handleCancelEnrollment = async (requestId?: string) => {
    try {
      const url = requestId ? `/api/admin/rfid/enroll?id=${requestId}` : "/api/admin/rfid/enroll";
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to cancel enrollment");
      showNotice("Enrollment request cancelled.");
      setPendingEnrollment(null);
      loadOverview();
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Cancel failed", true);
    }
  };

  // Toggle Access Enabled / Revoked
  const handleToggleAccess = async (person: PersonRow) => {
    try {
      const nextStatus = !person.access_enabled;
      const res = await fetch(`/api/admin/rfid/people/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_enabled: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle access");
      }

      showNotice(`Access ${nextStatus ? "granted" : "revoked"} for ${person.full_name}`);
      setPeople((prev) =>
        prev.map((p) => (p.id === person.id ? { ...p, access_enabled: nextStatus } : p))
      );
      loadOverview();
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Toggle failed", true);
    }
  };

  // Delete Person
  const handleDeletePerson = async (person: PersonRow) => {
    if (person.access_enabled) {
      showNotice("Revoke access before deleting this person.", true);
      return;
    }
    if (!confirm(`Are you sure you want to delete ${person.full_name} and unbind their badge?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/rfid/people/${person.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete person");
      }

      showNotice(`${person.full_name} deleted successfully.`);
      setPeople((prev) => prev.filter((p) => p.id !== person.id));
      if (editingId === person.id) resetForm();
      loadOverview();
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Delete failed", true);
    }
  };

  // Populate Edit Form
  const handleEditClick = (person: PersonRow) => {
    setIsEditing(true);
    setEditingId(person.id);
    setFormName(person.full_name);
    setFormClass(person.class_name || "");
    setFormDivision(person.division || "");
    setFormYear(person.academic_year || "");
    setFormRole(person.role || "member");
    setFormUid(person.card?.uid || "");
    setFormMemberId(person.member_id || "");
    setFormNotes(person.notes || "");

    // Scroll smoothly to form
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName("");
    setFormClass("");
    setFormDivision("");
    setFormYear("");
    setFormRole("member");
    setFormUid("");
    setFormMemberId("");
    setFormNotes("");
  };

  // Handle Form Submit (Add or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotice("Full Name is required.", true);
      return;
    }

    setSubmittingForm(true);
    try {
      const payload = {
        full_name: formName.trim(),
        class_name: formClass.trim(),
        division: formDivision.trim(),
        academic_year: formYear.trim(),
        role: formRole,
        uid: formUid.trim(),
        member_id: formMemberId || null,
        notes: formNotes.trim(),
      };

      if (isEditing && editingId) {
        const res = await fetch(`/api/admin/rfid/people/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update person");
        showNotice(`Updated details for ${formName.trim()}.`);
      } else {
        const res = await fetch("/api/admin/rfid/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add person");
        showNotice(`Added ${formName.trim()} to door access list.`);
      }

      resetForm();
      await Promise.all([loadPeople(), loadOverview()]);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Form submission failed", true);
    } finally {
      setSubmittingForm(false);
    }
  };

  // Filtered People List
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      const matchesSearch =
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.card?.uid && p.card.uid.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.class_name && p.class_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.member?.pnr_number && p.member.pnr_number.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = filterRole === "all" || p.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [people, searchQuery, filterRole]);

  // Loading State with Skeletons (Rule #21)
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-6 h-28 animate-pulse bg-surface-2/40" />
          ))}
        </div>
        <div className="glass-card rounded-xl p-8 h-96 animate-pulse bg-surface-2/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              notification.error
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-accent/10 border-accent/30 text-[color:var(--color-accent)]"
            }`}
          >
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-muted hover:text-foreground ml-4"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Radio className="w-5 h-5 text-[color:var(--color-accent)] animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {primaryDoor?.name || "Single-Door Controller"}
            </h2>
            <div className="text-xs text-muted font-mono">
              Code: {primaryDoor?.code || "main-door"} · Status:{" "}
              <span className={primaryDoor?.enabled ? "text-emerald-400" : "text-red-400"}>
                {primaryDoor?.enabled ? "Online & Active" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Remote Unlock Trigger */}
          <button
            onClick={handleRemoteUnlock}
            disabled={unlocking || unlockCooldown > 0 || !primaryDoor}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50"
          >
            {unlocking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : unlockCooldown > 0 ? (
              <Clock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            <span>
              {unlockCooldown > 0
                ? `Opening (${unlockCooldown}s)`
                : unlocking
                ? "Sending..."
                : "Open Door"}
            </span>
          </button>

          {/* Any-Card Mode Override Toggle */}
          <button
            onClick={handleToggleOverride}
            disabled={!primaryDoor}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
              isOverrideActive
                ? "bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25"
                : "btn-secondary"
            }`}
            title="Allows any card to unlock the door for 1 minute (auto-reverts in 2h)"
          >
            <Zap className={`w-4 h-4 ${isOverrideActive ? "text-red-400" : "text-muted"}`} />
            <span>{isOverrideActive ? "Any-Card Mode: ON" : "Any-Card Mode"}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="btn-secondary p-2.5 rounded-xl text-muted hover:text-foreground"
            title="Refresh RFID data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 border border-white/5">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            Registered People
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {stats.registeredPeople}
          </div>
          <div className="text-xs text-faint mt-1">Badge holders in access database</div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            Access Granted
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
            {stats.accessEnabled}
          </div>
          <div className="text-xs text-faint mt-1">Authorized to unlock strike</div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            Cards Assigned
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[color:var(--color-accent)] tracking-tight">
            {stats.cardsAssigned}
          </div>
          <div className="text-xs text-faint mt-1">Active RFID UIDs registered</div>
        </div>
      </div>

      {/* Live Card Enrollment Banner */}
      <AnimatePresence>
        {pendingEnrollment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-amber-400 mt-0.5 shrink-0 animate-bounce" />
                <div>
                  <div className="font-semibold text-sm sm:text-base text-amber-100 flex items-center gap-2">
                    Physical Badge Enrollment in Progress
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 font-mono">
                      {pendingEnrollment.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-amber-300/80 mt-1">
                    {pendingEnrollment.status === "requested"
                      ? "Step 1: Tap an enabled admin supervisor badge at the door reader."
                      : "Step 2: Admin verified! Now tap the new RFID card at the same reader."}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-amber-400/80">
                  Expires {format(new Date(pendingEnrollment.expires_at), "hh:mm:ss a")}
                </span>
                <button
                  onClick={() => handleCancelEnrollment(pendingEnrollment.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Add/Edit Person (Left) + Tables (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Add / Edit Person Form (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-2xl p-6 sticky top-28">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                {isEditing ? <Pencil className="w-4 h-4 text-accent" /> : <Plus className="w-4 h-4 text-accent" />}
                <span>{isEditing ? "Edit Badge Holder" : "Add New Person"}</span>
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-muted hover:text-white flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="field w-full px-3 py-2 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Class</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="e.g. CS"
                    className="field w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Division</label>
                  <input
                    type="text"
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    placeholder="e.g. A"
                    className="field w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="2026–27"
                    className="field w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Door Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as "member" | "admin")}
                    className="field w-full px-3 py-2 rounded-lg text-sm bg-surface-2"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin (Supervisor Badge)</option>
                  </select>
                </div>
              </div>

              {/* Link to Attendance Member */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-accent" />
                    <span>Link to Attendance Member</span>
                  </span>
                  <span className="text-[10px] text-faint">Auto-attendance check-in</span>
                </label>
                <select
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(e.target.value)}
                  className="field w-full px-3 py-2 rounded-lg text-sm bg-surface-2"
                >
                  <option value="">None (Standalone Badge Holder)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.pnr_number || u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Card UID */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1 flex items-center justify-between">
                  <span>Card UID (Hexadecimal)</span>
                  <span className="text-[10px] text-faint">Optional manual entry</span>
                </label>
                <input
                  type="text"
                  value={formUid}
                  onChange={(e) => setFormUid(e.target.value.toUpperCase())}
                  placeholder="e.g. 04A1B2C3"
                  className="field font-mono w-full px-3 py-2 rounded-lg text-sm uppercase tracking-wider"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional context or permissions..."
                  className="field w-full px-3 py-2 rounded-lg text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="btn-primary w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  {submittingForm && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditing ? "Save Changes" : "Add Person"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: People Table & Activity Logs (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* People & Cards Management Table */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div>
                <h3 className="text-base font-semibold text-white">People & Cards</h3>
                <p className="text-xs text-muted">Registered badge holders and assigned hardware cards</p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, UID..."
                    className="field pl-8 pr-3 py-1.5 rounded-lg text-xs w-full"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as "all" | "member" | "admin")}
                  className="field px-2.5 py-1.5 rounded-lg text-xs bg-surface-2"
                >
                  <option value="all">All Roles</option>
                  <option value="member">Members</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-surface-2 text-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Attendance Link</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 font-mono">Card UID</th>
                    <th className="px-4 py-3">Access</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPeople.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        No badge holders found. Add the first person using the form on the left.
                      </td>
                    </tr>
                  ) : (
                    filteredPeople.map((person) => {
                      const hasCard = Boolean(person.card?.uid);
                      return (
                        <tr key={person.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{person.full_name}</div>
                            {(person.class_name || person.division || person.academic_year) && (
                              <div className="text-[11px] text-muted">
                                {[person.class_name, person.division, person.academic_year]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {person.member ? (
                              <div className="flex items-center gap-1.5 text-accent text-[11px] font-medium">
                                <LinkIcon className="w-3 h-3 text-[color:var(--color-accent)]" />
                                <span>{person.member.name}</span>
                              </div>
                            ) : (
                              <span className="text-faint text-[11px]">Unlinked</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                person.role === "admin"
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                                  : "bg-white/5 text-muted"
                              }`}
                            >
                              {person.role === "admin" ? "Supervisor Admin" : "Member"}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono">
                            {hasCard ? (
                              <span className="text-foreground tracking-wider font-semibold">
                                {person.card!.uid}
                              </span>
                            ) : (
                              <span className="text-faint italic">No card assigned</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center gap-1 ${
                                person.access_enabled
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {person.access_enabled ? (
                                <>
                                  <UserCheck className="w-2.5 h-2.5" /> Granted
                                </>
                              ) : (
                                <>
                                  <UserX className="w-2.5 h-2.5" /> Revoked
                                </>
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit */}
                              <button
                                onClick={() => handleEditClick(person)}
                                className="btn-secondary p-1.5 rounded-lg text-muted hover:text-white"
                                title="Edit details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Access */}
                              <button
                                onClick={() => handleToggleAccess(person)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  person.access_enabled
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
                                }`}
                                title={person.access_enabled ? "Revoke Access" : "Grant Access"}
                              >
                                {person.access_enabled ? (
                                  <XCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Enroll Card */}
                              <button
                                onClick={() => handleEnrollCard(person.id)}
                                disabled={Boolean(pendingEnrollment) || !primaryDoor}
                                className="btn-secondary px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 text-muted hover:text-white disabled:opacity-40"
                                title="Enroll physical RFID badge"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Enroll</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeletePerson(person)}
                                disabled={person.access_enabled}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  person.access_enabled
                                    ? "opacity-30 cursor-not-allowed text-faint"
                                    : "hover:bg-red-500/20 text-red-400"
                                }`}
                                title={
                                  person.access_enabled
                                    ? "Revoke access before deleting"
                                    : "Permanently delete"
                                }
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
          </div>

          {/* Real-Time Live Activity Logs Table */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Live Access Logs</span>
                </h3>
                <p className="text-xs text-muted">
                  Real-time card taps and door events streaming directly from reader
                </p>
              </div>
              <span className="text-[11px] font-mono text-faint">
                {events.length} recent events
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5 max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-surface-2 text-muted font-medium sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3 font-mono">UID</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        No card scan events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    events.map((evt) => {
                      const isGrant =
                        evt.decision === "granted" ||
                        evt.decision === "exit" ||
                        evt.decision === "enrollment_success";
                      return (
                        <tr key={evt.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-muted text-[11px]">
                            {format(new Date(evt.created_at), "MMM d, hh:mm:ss a")}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-white">{evt.person_name}</td>
                          <td className="px-4 py-2.5 font-mono text-faint text-[11px]">
                            {evt.uid || "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                                isGrant
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {evt.decision}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted text-[11px]">
                            <span>{evt.reason}</span>
                            {evt.offline && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                offline
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-faint text-[11px]">
                            {evt.device_name}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
