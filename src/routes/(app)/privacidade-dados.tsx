import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { exportMyData, deleteMyAccount } from "@/lib/privacy.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/(app)/privacidade-dados")({
  head: () => ({
    meta: [{ title: "Privacidade e dados — SuaAgenda.Pro" }],
  }),
  component: PrivacidadeDadosPage,
});

function PrivacidadeDadosPage() {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportMyData({});
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suaagenda-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída");
    } catch {
      toast.error("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMyAccount({ data: { confirmEmail } });
      toast.success("Conta excluída");
      await signOut();
      window.location.href = "/";
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir conta");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col px-5 pb-24 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Privacidade e dados</h1>
            <p className="text-sm text-muted-foreground">Seus direitos LGPD (Art. 18)</p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border/60 p-5">
          <h2 className="font-semibold">Portabilidade</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Baixe uma cópia dos seus dados em JSON.
          </p>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 w-full"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exportando…" : "Exportar meus dados"}
          </Button>
        </section>

        <section className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="font-semibold text-destructive">Excluir conta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Remove permanentemente sua conta, perfil e dados. Agendamentos futuros serão
            cancelados. Esta ação não pode ser desfeita.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-4 w-full">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir minha conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Digite seu e-mail <strong>{user?.email}</strong> para confirmar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="confirm-email">E-mail</Label>
                <Input
                  id="confirm-email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={user?.email ?? ""}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting || confirmEmail.toLowerCase() !== user?.email?.toLowerCase()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Excluindo…" : "Excluir permanentemente"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
      <BottomNav />
    </MobileShell>
  );
}
