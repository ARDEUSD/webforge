import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, User, IdCard, LogIn, CheckCircle, Coffee, LogOut } from "lucide-react";
import { api, type Desk, ZONE_LABELS } from "@/lib/api";

interface Props {
  desk: Desk;
  onClose: () => void;
}

type Step = "form" | "success";

export default function CheckInModal({ desk, onClose }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const checkinMutation = useMutation({
    mutationFn: () => api.checkin(desk.id, { studentName: studentName.trim(), studentId: studentId.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      setStep("success");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const awayMutation = useMutation({
    mutationFn: () => api.markAway(desk.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      onClose();
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!studentName.trim()) { setError("Student name is required"); return; }
    if (!studentId.trim()) { setError("Student ID is required"); return; }
    checkinMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-card-border rounded-xl shadow-2xl mx-4">

        {/* ── Check-in form ── */}
        {step === "form" && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-white">Check In to Desk {desk.number}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{ZONE_LABELS[desk.zone]}</p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-white hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Shivam Dubey"
                    className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student ID</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU-8546"
                    className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkinMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {checkinMutation.isPending ? "Checking in…" : "Check In"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── Success + session actions ── */}
        {step === "success" && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <h2 className="text-base font-semibold text-white">You're checked in!</h2>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-white hover:bg-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Desk info */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                <p className="text-green-400 font-semibold text-lg">Desk {desk.number}</p>
                <p className="text-xs text-green-400/70 mt-0.5">{ZONE_LABELS[desk.zone]}</p>
                <p className="text-xs text-muted-foreground mt-1">Checked in as <span className="text-white font-medium">{studentName}</span></p>
              </div>

              {/* What do you want to do now? */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2">What would you like to do?</p>
                <div className="space-y-2">
                  <button
                    onClick={onClose}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary hover:bg-accent border border-border text-sm text-left transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <div>
                      <p className="font-medium text-white">Stay at my desk</p>
                      <p className="text-xs text-muted-foreground">All good — close this and get to work.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => awayMutation.mutate()}
                    disabled={awayMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary hover:bg-accent border border-border text-sm text-left transition-colors disabled:opacity-60"
                  >
                    <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-medium text-white">
                        {awayMutation.isPending ? "Marking away…" : "Step away temporarily"}
                      </p>
                      <p className="text-xs text-muted-foreground">Reserves your desk for up to 30 minutes.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary hover:bg-accent border border-border text-sm text-left transition-colors disabled:opacity-60"
                  >
                    <LogOut className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="font-medium text-white">
                        {checkoutMutation.isPending ? "Releasing desk…" : "Check out now"}
                      </p>
                      <p className="text-xs text-muted-foreground">Release the desk immediately.</p>
                    </div>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                You can manage your session later from the <span className="text-white">My Desk</span> card on the Dashboard.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
