import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle, Coffee, TrendingUp, Search, Activity, Radio, IdCard, LogOut, Clock, MapPin } from "lucide-react";
import { api, formatTimeAgo, formatTime, type Stats, type ActivityLog, type Desk, ZONE_LABELS } from "@/lib/api";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  isPercent,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  color: string;
  isPercent?: boolean;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">
            {value}
            {isPercent ? <span className="text-lg">%</span> : null}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {isPercent && (
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${value}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ActivityItem({ item }: { item: ActivityLog }) {
  const colors: Record<string, string> = {
    checkin: "bg-green-500",
    away: "bg-amber-500",
    checkout: "bg-blue-500",
  };
  const labels: Record<string, string> = {
    checkin: "checked in",
    away: "marked away",
    checkout: "checked out of",
  };

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors[item.action] ?? "bg-gray-500"}`} />
      <div className="min-w-0">
        <p className="text-sm text-white leading-snug">
          <span className="font-medium">{item.studentName}</span>{" "}
          <span className="text-muted-foreground">{labels[item.action] ?? item.action}</span>{" "}
          <span className="font-medium">Desk {item.deskNumber}</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{formatTimeAgo(item.occurredAt)}</p>
      </div>
    </div>
  );
}

function MyDeskCard() {
  const [studentId, setStudentId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const queryClient = useQueryClient();

  const { data: desk, error, isFetching, refetch } = useQuery<Desk>({
    queryKey: ["my-desk", submittedId],
    queryFn: () => api.getMyDesk(submittedId),
    enabled: !!submittedId,
    retry: false,
  });

  const awayMutation = useMutation({
    mutationFn: () => api.markAway(desk!.id),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api.checkout(desk!.id),
    onSuccess: () => {
      setSubmittedId("");
      setStudentId("");
      queryClient.invalidateQueries({ queryKey: ["my-desk"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (studentId.trim()) setSubmittedId(studentId.trim());
  }

  const statusColors: Record<string, string> = {
    occupied: "text-red-400 bg-red-500/10 border-red-500/20",
    away: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <IdCard className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-white">My Desk</h2>
        <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-medium">
          Student Self-Service
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Enter your Student ID to find your current desk, mark yourself away, or check out.
      </p>

      <form onSubmit={handleLookup} className="flex gap-2">
        <div className="relative flex-1">
          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. STU-8546"
            className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={!studentId.trim() || isFetching}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
        >
          {isFetching ? "Looking up…" : "Find My Desk"}
        </button>
      </form>

      {/* Result */}
      {submittedId && !isFetching && (
        <div className="mt-3">
          {error ? (
            <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2.5">
              <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />
              <p className="text-sm text-muted-foreground">No active desk session found for <span className="text-white font-medium">{submittedId}</span>. You're not checked in.</p>
            </div>
          ) : desk ? (
            <div className="bg-secondary border border-border rounded-lg p-3 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">You're at</p>
                  <p className="text-2xl font-bold text-white">Desk {String(desk.number).padStart(2, "0")}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{ZONE_LABELS[desk.zone]}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[desk.status] ?? ""}`}>
                  {desk.status === "away" ? "Away" : "Occupied"}
                </span>
              </div>
              {desk.session && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Checked in at {formatTime(desk.session.checkedInAt)} · {formatTimeAgo(desk.session.checkedInAt)}</span>
                </div>
              )}
              <div className="flex gap-2">
                {desk.status === "occupied" && (
                  <button
                    onClick={() => awayMutation.mutate()}
                    disabled={awayMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    {awayMutation.isPending ? "Marking…" : "Step Away"}
                  </button>
                )}
                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {checkoutMutation.isPending ? "Checking out…" : "Check Out"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Desk[] | null>(null);
  const [searching, setSearching] = useState(false);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 10000,
  });

  const { data: activity } = useQuery<ActivityLog[]>({
    queryKey: ["activity"],
    queryFn: () => api.getActivity(20),
    refetchInterval: 10000,
  });

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const results = await api.searchDesks(q);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  const statCards = [
    { label: "Total Desks", value: stats?.total ?? 0, sub: "Configured on Floor 1", icon: Users, color: "bg-blue-600" },
    { label: "Occupied", value: stats?.occupied ?? 0, sub: "Active sessions", icon: Activity, color: "bg-red-500" },
    { label: "Available Free", value: stats?.free ?? 0, sub: "Ready for check-in", icon: CheckCircle, color: "bg-green-600" },
    { label: "Away / Reserving", value: stats?.away ?? 0, sub: "Temporary absences", icon: Coffee, color: "bg-amber-500" },
    { label: "Occupancy Rate", value: stats?.occupancyRate ?? 0, sub: "Current utilization", icon: TrendingUp, color: "bg-purple-600", isPercent: true },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            DeskGuard <span className="text-muted-foreground font-normal">System Overview</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time occupancy metrics and library status dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-card-border rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live Sensor Stream</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Search + How it works */}
        <div className="lg:col-span-3 space-y-4">
          {/* My Desk — student self-service */}
          <MyDeskCard />

          {/* Quick Desk Finder */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-white">Quick Desk Finder</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Find a study desk by typing a number or location zone (e.g., "Quiet", "PC", "Window").
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search desk number or zone..."
                className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Search results */}
            {searchQuery && (
              <div className="mt-3 space-y-1">
                {searching ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Searching…</p>
                ) : searchResults && searchResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No desks found</p>
                ) : (
                  searchResults?.slice(0, 8).map((desk) => (
                    <div key={desk.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            desk.status === "free" ? "bg-green-500" : desk.status === "occupied" ? "bg-red-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="text-sm text-white font-medium">Desk {desk.number}</span>
                        <span className="text-xs text-muted-foreground">{ZONE_LABELS[desk.zone]}</span>
                      </div>
                      <span
                        className={`text-xs font-medium capitalize ${
                          desk.status === "free" ? "text-green-400" : desk.status === "occupied" ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {desk.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* How DeskGuard Works */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">How DeskGuard Works</h2>
            <div className="space-y-3">
              {[
                { color: "bg-green-500", title: "Green (Free)", desc: "Desk is fully open. You can check in instantly by walking up and claiming it." },
                { color: "bg-red-500", title: "Red (Occupied)", desc: "Desk is actively in use by another student." },
                { color: "bg-amber-500", title: "Yellow (Away)", desc: "The student has stepped away temporarily. Desks are reserved for up to 30 minutes before release." },
              ].map(({ color, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className={`w-3 h-3 rounded-full ${color} mt-0.5 shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-white">Recent Desk Activity</h2>
          </div>
          {!activity || activity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No activity yet</p>
          ) : (
            <div className="divide-y divide-border">
              {activity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
