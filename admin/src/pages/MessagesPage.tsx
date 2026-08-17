import { useState } from "react";
import { toast } from "sonner";
import { CheckCheck, Mail, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks";
import { adminApi } from "@/lib/api";
import type { AdminMessage } from "@/lib/types";

export function MessagesPage() {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const { data: messages, loading, refetch } = useApi<AdminMessage[]>(
    () => adminApi.get(`/admin/messages${tab === "unread" ? "?unread=1" : ""}`),
    [tab],
  );

  async function markRead(message: AdminMessage) {
    try {
      await adminApi.patch(`/admin/messages/${message.id}/read`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    }
  }

  async function remove(message: AdminMessage) {
    if (!confirm("Hapus pesan ini?")) return;
    try {
      await adminApi.delete(`/admin/messages/${message.id}`);
      toast.success("Pesan dihapus");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesan Kontak</h1>
          <p className="text-sm text-muted-foreground">Pesan yang masuk dari form kontak.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
          <Button
            size="sm"
            variant={tab === "all" ? "default" : "ghost"}
            onClick={() => setTab("all")}
          >
            Semua
          </Button>
          <Button
            size="sm"
            variant={tab === "unread" ? "default" : "ghost"}
            onClick={() => setTab("unread")}
          >
            Belum dibaca
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (messages ?? []).length === 0 ? (
        <p className="text-muted-foreground">Tidak ada pesan.</p>
      ) : (
        <div className="space-y-3">
          {(messages ?? []).map((message) => (
            <Card key={message.id} className={message.is_read ? "" : "border-primary/40"}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {message.is_read ? (
                      <MailOpen className="size-4 text-muted-foreground" />
                    ) : (
                      <Mail className="size-4 text-primary" />
                    )}
                    <CardTitle className="text-base">{message.subject || "(tanpa subjek)"}</CardTitle>
                    {!message.is_read && <Badge>Baru</Badge>}
                  </div>
                  <CardDescription>
                    {new Date(message.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </CardDescription>
                </div>
                <CardDescription>
                  {message.name} ·{" "}
                  <a href={`mailto:${message.email}`} className="underline underline-offset-2">
                    {message.email}
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                <div className="flex gap-2">
                  {!message.is_read && (
                    <Button size="sm" variant="outline" onClick={() => markRead(message)}>
                      <CheckCheck className="mr-1 size-4" /> Tandai dibaca
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${message.email}?subject=Re: ${message.subject ?? ""}`}>Balas</a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(message)}
                  >
                    <Trash2 className="mr-1 size-4" /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}