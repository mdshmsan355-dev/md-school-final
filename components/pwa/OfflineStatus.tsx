import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { syncOfflineQueue } from "@/lib/offline-sync";
import { getCurrentUserIdFromJwt } from "@/lib/offline-store";

export function OfflineStatus() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      const result = await syncOfflineQueue(getCurrentUserIdFromJwt());
      setPending(result.failed);
    };
    const onOnline = () => { setOnline(true); setSyncing(true); void refresh().finally(() => setSyncing(false)); };
    const onOffline = () => setOnline(false);
    const onQueued = () => { setQueued(true); window.setTimeout(() => setQueued(false), 2600); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("md-school-offline-queued", onQueued);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); window.removeEventListener("md-school-offline-queued", onQueued); };
  }, []);

  if (online && !syncing && pending === 0 && !queued) return null;
  return (
    <div className={`fixed bottom-3 left-1/2 z-[80] -translate-x-1/2 rounded-full border px-4 py-2 text-xs shadow-lg backdrop-blur ${online ? "border-amber-300 bg-amber-50/95 text-amber-900" : "border-destructive/30 bg-destructive/10 text-destructive"}`} role="status">
      {queued && online ? <Cloud className="me-2 inline size-3.5" /> : online ? <RefreshCw className="me-2 inline size-3.5 animate-spin" /> : <CloudOff className="me-2 inline size-3.5" />}
      {queued && online ? "تم حفظ العملية محليًا وستتم مزامنتها عند عودة الإنترنت." : online ? "تتم مزامنة البيانات المحفوظة…" : "أنت غير متصل — البيانات المخزنة محليًا متاحة للعرض، وستتم مزامنة العمليات عند عودة الإنترنت."}
    </div>
  );
}
