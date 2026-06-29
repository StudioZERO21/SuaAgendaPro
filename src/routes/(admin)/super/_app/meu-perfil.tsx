import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  User, KeyRound, ShieldCheck, ShieldOff, RefreshCw,
  Save, Loader2, Plus, Trash2, Mail, Eye, EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { cn }       from "@/lib/utils";
import { toast }    from "sonner";
import { withSuperToken, getSuperToken } from "@/lib/super-client";
import { getMyProfile, updateMyName, changeMyPassword, listSuperAdmins, createSuperAdmin, removeSuperAdmin, type SuperAdminProfile, type SuperAdminListItem } from "@/lib/super-profile.functions";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(admin)/super/_app/meu-perfil")({
  ssr: false,
  head: () => ({ meta: [{ title: "Meu Perfil — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: MeuPerfilPage,
});

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 space-y-4", className)}>
      {children}
    </div>
  );
}

function MeuPerfilPage() {
  const [profile, setProfile]   = useState<SuperAdminProfile | null>(null);
  const [admins,  setAdmins]    = useState<SuperAdminListItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  // Edit name
  const [editName, setEditName] = useState("");

  // Change password
  const [curPwd,  setCurPwd]  = useState("");
  const [newPwd,  setNewPwd]  = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // New admin form
  const [showNewAdmin, setShowNewAdmin] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName,  setNewName]  = useState("");
  const [newPass,  setNewPass]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        getMyProfile({ data: withSuperToken() }),
        listSuperAdmins({ data: withSuperToken() }),
      ]);
      setProfile(p);
      setEditName(p.name);
      setAdmins(a);
    } catch (e: unknown) {
      toast.error("Erro ao carregar perfil: " + (e instanceof Error ? e.message : ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSaveName() {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateMyName({ data: withSuperToken({ name: editName.trim() }) });
      toast.success("Nome atualizado.");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSaving(false); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 8) { toast.error("Nova senha deve ter pelo menos 8 caracteres"); return; }
    if (newPwd !== confPwd) { toast.error("As senhas não coincidem"); return; }
    setSaving(true);
    try {
      await changeMyPassword({ data: withSuperToken({ currentPassword: curPwd, newPassword: newPwd }) });
      toast.success("Senha alterada com sucesso.");
      setCurPwd(""); setNewPwd(""); setConfPwd("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar senha");
    } finally { setSaving(false); }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newName || !newPass) { toast.error("Preencha todos os campos"); return; }
    setSaving(true);
    try {
      await createSuperAdmin({ data: withSuperToken({ email: newEmail, name: newName, password: newPass, sendWelcomeEmail: true }) });
      toast.success(`Admin ${newName} criado e e-mail de boas-vindas enviado.`);
      setNewEmail(""); setNewName(""); setNewPass(""); setShowNewAdmin(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar admin");
    } finally { setSaving(false); }
  }

  async function handleRemoveAdmin(email: string, name: string) {
    if (!confirm(`Remover ${name} (${email}) do painel super admin?`)) return;
    try {
      await removeSuperAdmin({ data: withSuperToken({ email }) });
      toast.success(`${name} removido.`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* ── Identidade ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <SectionCard>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
              <User className="h-5 w-5" />
            </div>
            <p className="font-semibold">Identidade</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail</label>
              <p className="mt-1 text-sm font-medium">{profile?.email}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome de exibição</label>
              <div className="flex gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Seu nome"
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={saving || editName.trim() === profile?.name || !editName.trim()}
                  size="sm"
                  className="gap-1.5 gradient-primary text-white"
                >
                  <Save className="h-3.5 w-3.5" /> Salvar
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* ── Segurança — Senha ────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <SectionCard>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <p className="font-semibold">Alterar senha</p>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Senha atual</label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={curPwd}
                  onChange={(e) => setCurPwd(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova senha</label>
                <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Mín. 8 caracteres" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirmar</label>
                <Input type="password" value={confPwd} onChange={(e) => setConfPwd(e.target.value)} placeholder="Repita a senha" />
              </div>
            </div>
            {newPwd && confPwd && newPwd !== confPwd && (
              <p className="text-xs text-destructive">As senhas não coincidem</p>
            )}
            <Button type="submit" disabled={saving || !curPwd || newPwd.length < 8 || newPwd !== confPwd}
              className="gap-2 gradient-primary text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Alterar senha
            </Button>
          </form>
        </SectionCard>
      </motion.div>

      {/* ── Segurança — MFA ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl",
                profile?.mfaEnabled ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground")}>
                {profile?.mfaEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold">Autenticação de 2 fatores</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.mfaEnabled ? "MFA ativo — sua conta está protegida" : "MFA inativo — recomendamos ativar"}
                </p>
              </div>
            </div>
            <Badge variant={profile?.mfaEnabled ? "default" : "secondary"} className={profile?.mfaEnabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>
              {profile?.mfaEnabled ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <Link to="/super/mfa-setup">
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              <ShieldCheck className="h-4 w-4" />
              {profile?.mfaEnabled ? "Gerenciar / Desativar MFA" : "Ativar MFA agora"}
            </Button>
          </Link>
        </SectionCard>
      </motion.div>

      {/* ── Outros super admins ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SectionCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <User className="h-5 w-5" />
              </div>
              <p className="font-semibold">Super Admins</p>
            </div>
            <Button size="sm" onClick={() => setShowNewAdmin((v) => !v)} className="gap-1.5 gradient-primary text-white">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          {showNewAdmin && (
            <form onSubmit={handleCreateAdmin} className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
              <p className="text-sm font-semibold">Novo super admin</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail</label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Senha provisória</label>
                <Input type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mín. 8 caracteres" />
              </div>
              <p className="text-xs text-muted-foreground">Um e-mail com as credenciais será enviado. O usuário deverá trocar a senha no primeiro acesso.</p>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} size="sm" className="gap-1.5 gradient-primary text-white">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Criar e enviar e-mail
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewAdmin(false)}>Cancelar</Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {admins.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum admin cadastrado no banco ainda.<br/>Faça logout e login novamente para migrar automaticamente.</p>
            )}
            {admins.map((a) => (
              <div key={a.email} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{a.name}</p>
                    {a.mustChangePassword && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px]">troca pendente</Badge>
                    )}
                    {a.email === profile?.email && (
                      <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-[10px]">você</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                </div>
                {a.email !== profile?.email && (
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveAdmin(a.email, a.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
