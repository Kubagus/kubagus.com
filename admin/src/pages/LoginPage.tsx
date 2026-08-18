import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<{ email: string; password: string } | null>(null);

  async function doLogin(credentials: { email: string; password: string }) {
    setError(null);
    setSubmitting(true);
    try {
      await login(credentials.email, credentials.password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending({ email, password });
    setConfirmOpen(true);
  }

  function onConfirm() {
    setConfirmOpen(false);
    if (pending) doLogin(pending);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span
            className="flex size-12 items-center justify-center rounded-lg bg-primary font-mono text-2xl font-bold leading-none text-primary-foreground"
            aria-label="kubagus.com"
          >
            {"|<"}
          </span>
          <CardTitle className="mt-2">Panel Admin kubagus.com</CardTitle>
          <CardDescription>Masuk untuk mengelola konten situs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kubagus.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-1 size-4 animate-spin" />}
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Login</DialogTitle>
            <DialogDescription>
              Anda akan masuk ke panel admin sebagai{" "}
              <span className="font-medium text-foreground">{pending?.email}</span>. Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="button" onClick={onConfirm} disabled={submitting}>
              {submitting && <Loader2 className="mr-1 size-4 animate-spin" />}
              Ya, Masuk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}