import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Shield, LogOut, RotateCcw, CheckCircle, Coffee, Users,
  Activity, TrendingUp, AlertTriangle, Clock
} from "lucide-react";
import { api, type Desk, type ActivityLog, ZONE_LABELS, formatTimeAgo } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function AdminStatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl px-4 py-3 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function DeskRow({ desk, onReset }: { desk: Desk; onReset: (id: number) => void }) {
  const statusColors: Record<string, string> = {
    free: "text-green-400 bg-green-500/10 border-green-500/20",
    occupied: "text-red-400 bg-red-500/10 border-red-500/20",
    away: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <tr className="border-b border-border hover:bg-secondary/30 transition-colors">
      <td className="px-3 py-2.5 text-sm font-semibold text-white">
        {String(desk.number).padStart(2, "0")}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{ZONE_LABELS[desk.zone]}</td>
      <td className="px-3 py-2.5">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[desk.status]}`}>
          {desk.status}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {desk.session ? desk.session.studentName : "—"}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {desk.session ? desk.session.studentId : "—"}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {desk.session ? formatTimeAgo(desk.session.checkedInAt) : "—"}
      </td>
      <td className="px-3 py-2.5">
        {desk.status !== "free" && (
          <button
            onClick={() => onReset(desk.id)}
            title="Force release desk"
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </td>
    </tr>
  );
}

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      navigate("/admin/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  const { data: desks, isLoading: desksLoading } = useQuery<Desk[]>({
    queryKey: ["admin-desks"],
    queryFn: api.adminGetDesks,
    refetchInterval: 10000,
  });

  const { data: activity } = useQuery<ActivityLog[]>({
    queryKey: ["admin-activity"],
    queryFn: () => api.adminGetActivity(50),
    refetchInterval: 10000,
  });

  const resetMutation = useMutation({
    mutationFn: (id: number) => api.adminResetDesk(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-desks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity"] });
    },
  });

  const stats = {
    total: desks?.length ?? 0,
    occupied: desks?.filter((d) => d.status === "occupied").length ?? 0,
    free: desks?.filter((d) => d.status === "free").length ?? 0,
    away: desks?.filter((d) => d.status === "away").length ?? 0,
  };

  const actionColors: Record<string, string> = {
    checkin: "text-green-400 bg-green-500",
    away: "text-amber-400 bg-amber-500",
    checkout: "text-blue-400 bg-blue-500",
  };
  const actionLabels: Record<string, string> = {
    checkin: "checked in",
    away: "marked away",
    checkout: "checked out",
  };

  function handleLogout() {
    logout();
    navigate("/dashboard");
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Logged in as <span className="text-white font-medium">{user.username}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-secondary border border-border transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard label="Total Desks" value={stats.total} icon={Users} color="bg-blue-600" />
        <AdminStatCard label="Occupied" value={stats.occupied} icon={Activity} color="bg-red-500" />
        <AdminStatCard label="Available" value={stats.free} icon={CheckCircle} color="bg-green-600" />
        <AdminStatCard label="Away" value={stats.away} icon={Coffee} color="bg-amber-500" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Desk Management Table */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-white">Desk Management</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {desks?.filter((d) => d.status !== "free").length ?? 0} active sessions
            </span>
          </div>
          {desksLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    {["#", "Zone", "Status", "Student", "ID", "Since", "Action"].map((h) => (
                      <th key={h} className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {desks?.map((desk) => (
                    <DeskRow key={desk.id} desk={desk} onReset={(id) => resetMutation.mutate(id)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-white">Activity Log</h2>
          </div>
          <div className="overflow-y-auto max-h-[480px]">
            {!activity || activity.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activity.map((item) => (
                  <div key={item.id} className="px-4 py-2.5 flex items-start gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      item.action === "checkin" ? "bg-green-500" : item.action === "away" ? "bg-amber-500" : "bg-blue-500"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs text-white leading-snug">
                        <span className="font-medium">{item.studentName}</span>{" "}
                        <span className="text-muted-foreground">{actionLabels[item.action] ?? item.action}</span>{" "}
                        <span className="font-medium">Desk {item.deskNumber}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatTimeAgo(item.occurredAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning for away desks */}
      {stats.away > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-300">
            <strong>{stats.away}</strong> desk{stats.away > 1 ? "s are" : " is"} marked as away. Away desks auto-release after 30 minutes of inactivity.
            Use the Reset button above to manually release any desk.
          </p>
        </div>
      )}
    </div>
  );
}
