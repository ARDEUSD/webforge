import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, User, IdCard, Clock, BookOpen, Users, Monitor, Eye, Coffee, LogOut } from "lucide-react";
import { api, type Desk, type Zone, ZONE_LABELS, formatTime, formatTimeAgo, formatDuration } from "@/lib/api";
import CheckInModal from "@/components/CheckInModal";

const ZONE_ICONS: Record<Zone, React.ElementType> = {
  quiet_study: BookOpen,
  collaboration: Users,
  pc_lab: Monitor,
  window_view: Eye,
};

function DeskCell({ desk, isSelected, onClick }: { desk: Desk; isSelected: boolean; onClick: () => void }) {
  const dotColor = desk.status === "free" ? "bg-green-500" : desk.status === "occupied" ? "bg-red-500" : "bg-amber-500";
  const hasSession = desk.status !== "free" && desk.session;

  return (
    <div className="relative group aspect-square">
      <button
        onClick={onClick}
        className={`w-full h-full flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
          isSelected
            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40"
            : desk.status === "free"
            ? "bg-secondary border-border text-muted-foreground hover:border-green-500/50 hover:bg-accent"
            : desk.status === "occupied"
            ? "bg-secondary border-border text-white hover:border-red-500/50 hover:bg-accent"
            : "bg-secondary border-border text-white hover:border-amber-500/50 hover:bg-accent"
        }`}
      >
        <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {/* Session timer shown instead of number when occupied/away */}
        {hasSession ? (
          <div className="flex flex-col items-center leading-none gap-0.5">
            <span className="text-[10px] font-bold">{String(desk.number).padStart(2, "0")}</span>
            <span className={`text-[9px] font-semibold ${desk.status === "occupied" ? "text-red-400" : "text-amber-400"}`}>
              {formatDuration(desk.session!.checkedInAt)}
            </span>
          </div>
        ) : (
          String(desk.number).padStart(2, "0")
        )}
      </button>

      {/* Hover tooltip — only for occupied/away desks */}
      {hasSession && (
        <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="bg-[#1c2333] border border-border rounded-lg px-3 py-2 shadow-xl text-left whitespace-nowrap">
            <p className="text-xs font-semibold text-white">{desk.session!.studentName}</p>
            <p className="text-[10px] text-muted-foreground">{desk.session!.studentId}</p>
            <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-border">
              <Clock className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              <span className={`text-[10px] font-semibold ${desk.status === "occupied" ? "text-red-400" : "text-amber-400"}`}>
                {formatDuration(desk.session!.checkedInAt)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                · {desk.status === "away" ? "away" : "active"}
              </span>
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-[#1c2333] border-r border-b border-border rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}

function ZoneCard({
  zone,
  desks,
  selectedDeskId,
  onDeskClick,
}: {
  zone: Zone;
  desks: Desk[];
  selectedDeskId: number | null;
  onDeskClick: (desk: Desk) => void;
}) {
  const Icon = ZONE_ICONS[zone];
  const free = desks.filter((d) => d.status === "free").length;

  const cols = desks.length <= 10 ? 5 : 5;

  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-white">{ZONE_LABELS[zone]}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {free} / {desks.length} available
        </span>
      </div>
      <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {desks.map((desk) => (
          <DeskCell
            key={desk.id}
            desk={desk}
            isSelected={selectedDeskId === desk.id}
            onClick={() => onDeskClick(desk)}
          />
        ))}
      </div>
    </div>
  );
}

function DeskDetailsPanel({
  desk,
  onClose,
}: {
  desk: Desk;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const awayMutation = useMutation({
    mutationFn: () => api.markAway(desk.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api.checkout(desk.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      onClose();
    },
  });

  const statusStyles: Record<string, string> = {
    free: "bg-green-500/20 text-green-400 border-green-500/20",
    occupied: "bg-red-500/20 text-red-400 border-red-500/20",
    away: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  };

  return (
    <div className="w-64 shrink-0 bg-card border border-card-border rounded-xl p-4 space-y-4 self-start sticky top-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Desk Details</p>
          <h2 className="text-xl font-bold text-white">Desk {String(desk.number).padStart(2, "0")}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-white hover:bg-secondary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Zone + Status */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Location Zone</span>
          <span className="text-white font-medium">{ZONE_LABELS[desk.zone]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Current Status</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusStyles[desk.status]}`}
          >
            {desk.status === "away" ? "Away" : desk.status === "occupied" ? "Occupied" : "Free"}
          </span>
        </div>
      </div>

      {/* Occupant Info */}
      {desk.session && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Occupant Information</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Student Name</p>
                <p className="text-sm font-semibold text-white">{desk.session.studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <IdCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Student ID</p>
                <p className="text-sm font-semibold text-white">{desk.session.studentId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Check-in Time</p>
                <p className="text-sm font-semibold text-white">{formatTime(desk.session.checkedInAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {desk.status === "occupied" && (
        <div className="space-y-2 pt-2 border-t border-border">
          <button
            onClick={() => awayMutation.mutate()}
            disabled={awayMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Coffee className="w-4 h-4" />
            {awayMutation.isPending ? "Marking…" : "Mark Away"}
          </button>
          <button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            {checkoutMutation.isPending ? "Releasing…" : "Check Out / Release"}
          </button>
        </div>
      )}

      {desk.status === "away" && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Student is temporarily away. Auto-releases in 30 min.
          </p>
          <button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            {checkoutMutation.isPending ? "Releasing…" : "Release Desk"}
          </button>
        </div>
      )}

      {desk.status === "free" && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-center">
            Desk is available. Click to check in.
          </p>
        </div>
      )}
    </div>
  );
}

function ManageSessionBar() {
  const [studentId, setStudentId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const queryClient = useQueryClient();

  const { data: desk, error, isFetching } = useQuery<Desk>({
    queryKey: ["manage-desk", submittedId],
    queryFn: () => api.getMyDesk(submittedId),
    enabled: !!submittedId,
    retry: false,
    refetchInterval: 10000,
  });

  const awayMutation = useMutation({
    mutationFn: () => api.markAway(desk!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-desk"] });
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api.checkout(desk!.id),
    onSuccess: () => {
      setSubmittedId("");
      setStudentId("");
      queryClient.invalidateQueries({ queryKey: ["manage-desk"] });
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (studentId.trim()) setSubmittedId(studentId.trim());
  }

  return (
    <div className="bg-card border border-card-border rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <Coffee className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Manage My Session</span>
          <span className="text-xs text-muted-foreground">— enter your Student ID to step away or check out</span>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[140px]">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. STU-8546"
              className="w-full pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={!studentId.trim() || isFetching}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            {isFetching ? "…" : "Find"}
          </button>
        </form>

        {/* Inline result */}
        {submittedId && !isFetching && (
          error ? (
            <span className="text-xs text-muted-foreground">No active session for <span className="text-white">{submittedId}</span></span>
          ) : desk ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white font-medium">Desk {String(desk.number).padStart(2, "0")}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                desk.status === "occupied" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
              }`}>{desk.status}</span>
              {desk.status === "occupied" && (
                <button
                  onClick={() => awayMutation.mutate()}
                  disabled={awayMutation.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors disabled:opacity-60"
                >
                  <Coffee className="w-3 h-3" />
                  {awayMutation.isPending ? "…" : "Step Away"}
                </button>
              )}
              {desk.status === "away" && (
                <span className="text-xs text-amber-400">Desk reserved — auto-releases in 30 min</span>
              )}
              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-60"
              >
                <LogOut className="w-3 h-3" />
                {checkoutMutation.isPending ? "…" : "Check Out"}
              </button>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

export default function LibraryMap() {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [checkingInDesk, setCheckingInDesk] = useState<Desk | null>(null);

  const { data: desks, isLoading } = useQuery<Desk[]>({
    queryKey: ["desks"],
    queryFn: api.getDesks,
    refetchInterval: 10000,
  });

  const stats = {
    free: desks?.filter((d) => d.status === "free").length ?? 0,
    occupied: desks?.filter((d) => d.status === "occupied").length ?? 0,
    away: desks?.filter((d) => d.status === "away").length ?? 0,
  };

  function handleDeskClick(desk: Desk) {
    if (desk.status === "free") {
      setCheckingInDesk(desk);
      setSelectedDesk(null);
    } else {
      // Refresh single desk data to get latest session info
      setSelectedDesk(desks?.find((d) => d.id === desk.id) ?? desk);
    }
  }

  // Keep selectedDesk in sync with query data
  const currentSelectedDesk = selectedDesk
    ? desks?.find((d) => d.id === selectedDesk.id) ?? selectedDesk
    : null;

  const zones: Zone[] = ["quiet_study", "collaboration", "pc_lab", "window_view"];

  const desksByZone = (zone: Zone) => (desks ?? []).filter((d) => d.zone === zone);

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Interactive Floor Map</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Click a <span className="text-green-400 font-medium">green desk</span> to check in. Already here? Enter your Student ID below to step away or leave.
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4">
          {[
            { color: "bg-green-500", label: `Free (${stats.free})` },
            { color: "bg-red-500", label: `Occupied (${stats.occupied})` },
            { color: "bg-amber-500", label: `Away (${stats.away})` },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Manage My Session bar */}
      <ManageSessionBar />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Loading floor map…</div>
        </div>
      ) : (
        <div className="flex gap-4 items-start">
          {/* Zone Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {zones.map((zone) => (
              <ZoneCard
                key={zone}
                zone={zone}
                desks={desksByZone(zone)}
                selectedDeskId={currentSelectedDesk?.id ?? null}
                onDeskClick={handleDeskClick}
              />
            ))}
          </div>

          {/* Desk Details Panel */}
          {currentSelectedDesk && currentSelectedDesk.status !== "free" && (
            <DeskDetailsPanel desk={currentSelectedDesk} onClose={() => setSelectedDesk(null)} />
          )}
        </div>
      )}

      {/* Check-in Modal */}
      {checkingInDesk && (
        <CheckInModal desk={checkingInDesk} onClose={() => setCheckingInDesk(null)} />
      )}
    </div>
  );
}
