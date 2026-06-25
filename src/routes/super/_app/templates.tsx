import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Mail, MessageSquare, Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { withSuperToken } from "@/lib/super-client";
import {
  getTemplates, upsertTemplate, deleteTemplate, previewTemplate, sendTestEmail,
  type MessageTemplate,
} from "@/lib/super-templates.functions";

export const Route = createFileRoute("/super/_app/templates")({
  ssr: false,
  head: () => ({ meta: [{ title: "Templates — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: TemplatesPage,
});

const EMPTY: Omit<MessageTemplate, "id" | "created_at" | "updated_at"> = {
  name: "", type: "whatsapp", event: "", subject: null, body: "", variables: [], is_active: true,
};

function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState<Partial<MessageTemplate> | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [preview, setPreview]     = useState<{ body: string; html: string } | null>(null);
  const [varInput, setVarInput]   = useState("");
  const [testTarget, setTestTarget]     = useState<MessageTemplate | null>(null);
  const [testEmail, setTestEmail]       = useState("adrianoelite@msn.com");
  const [testSending, setTestSending]   = useState(false);

  function load() {
    setLoading(true);
    getTemplates({ data: withSuperToken() })
      .then(setTemplates)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save() {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.event?.trim() || !editing.body?.trim()) {
      toast.error("Preencha nome, evento e corpo do template.");
      return;
    }
    setSaving(true);
    try {
      await upsertTemplate({
        data: withSuperToken({
          id:        editing.id,
          name:      editing.name!,
          type:      editing.type as "email" | "whatsapp",
          event:     editing.event!,
          subject:   editing.subject ?? null,
          body:      editing.body!,
          variables: editing.variables ?? [],
          is_active: editing.is_active ?? true,
        }),
      });
      toast.success(editing.id ? "Template atualizado" : "Template criado");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  }

  async function del(id: string) {
    setDeleting(id);
    try {
      await deleteTemplate({ data: withSuperToken({ id }) });
      toast.success("Template excluído");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setDeleting(null); }
  }

  async function sendTest() {
    if (!testTarget) return;
    setTestSending(true);
    try {
      const result = await sendTestEmail({
        data: withSuperToken({ id: testTarget.id, recipient: testEmail }),
      });
      if (result.ok) {
        toast.success(result.message);
        setTestTarget(null);
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally { setTestSending(false); }
  }

  async function showPreview(t: MessageTemplate) {
    const sampleVars = Object.fromEntries(t.variables.map((v) => [v, `[${v}]`]));
    try {
      const { html } = await previewTemplate({ data: withSuperToken({ body: t.body, variables: sampleVars }) });
      setPreview({ body: t.body, html });
    } catch (e: any) { toast.error(e.message); }
  }

  const byType = {
    email:     templates.filter((t) => t.type === "email"),
    whatsapp:  templates.filter((t) => t.type === "whatsapp"),
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Conteúdo</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Templates de Mensagem</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Email e WhatsApp para notificações automáticas.</p>
        </div>
        <Button onClick={() => setEditing(EMPTY)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Template
        </Button>
      </header>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground animate-pulse">Carregando templates…</p>
      ) : (
        <div className="space-y-8">
          {(["email", "whatsapp"] as const).map((type) => (
            <section key={type}>
              <div className="mb-3 flex items-center gap-2">
                {type === "email"
                  ? <Mail className="h-4 w-4 text-muted-foreground" />
                  : <MessageSquare className="h-4 w-4 text-muted-foreground" />
                }
                <h2 className="font-semibold capitalize">{type === "email" ? "E-mail" : "WhatsApp"}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {byType[type].length}
                </span>
              </div>
              {byType[type].length === 0 ? (
                <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  Nenhum template de {type === "email" ? "e-mail" : "WhatsApp"} cadastrado.
                </p>
              ) : (
                <div className="divide-y divide-border rounded-none border border-border">
                  {byType[type].map((t) => (
                    <div key={t.id} className="flex items-start gap-4 p-4 hover:bg-muted/20">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm">{t.name}</p>
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t.event}</span>
                          {!t.is_active && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">Inativo</span>}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {t.variables.map((v) => (
                            <span key={v} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="ghost" onClick={() => showPreview(t)} title="Prévia">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {t.type === "email" && (
                          <Button size="sm" variant="ghost" onClick={() => setTestTarget(t)} title="Testar envio" className="text-blue-500 hover:text-blue-600">
                            <SendHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setEditing(t)} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" disabled={deleting === t.id} onClick={() => del(t.id)} title="Excluir" className="text-rose-500 hover:text-rose-600">
                          {deleting === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar template" : "Novo template"}</DialogTitle>
            <DialogDescription>Configure o conteúdo e as variáveis disponíveis.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, name: e.target.value }))} placeholder="Ex: Trial expirando — WhatsApp" />
                </div>
                <div className="space-y-1.5">
                  <Label>Evento (chave única)</Label>
                  <Input value={editing.event ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, event: e.target.value }))} placeholder="Ex: trial_expiring_1d" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.type ?? "whatsapp"}
                  onChange={(e) => setEditing((p) => ({ ...p!, type: e.target.value as any }))}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">E-mail</option>
                </select>
              </div>
              {editing.type === "email" && (
                <div className="space-y-1.5">
                  <Label>Assunto do e-mail</Label>
                  <Input value={editing.subject ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, subject: e.target.value }))} placeholder="Ex: Seu trial termina em {{dias_restantes}} dias" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Corpo da mensagem</Label>
                <Textarea
                  value={editing.body ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p!, body: e.target.value }))}
                  rows={8}
                  placeholder={editing.type === "email" ? "<h2>Olá, {{nome}}!</h2>..." : "⏰ *{{nome}}*, seu trial termina amanhã!"}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">Use {`{{variavel}}`} para inserir valores dinâmicos.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Variáveis (separadas por vírgula)</Label>
                <Input
                  value={varInput || (editing.variables ?? []).join(", ")}
                  onChange={(e) => {
                    setVarInput(e.target.value);
                    setEditing((p) => ({ ...p!, variables: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) }));
                  }}
                  placeholder="nome, dias_restantes, link_pagamento"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {(editing.variables ?? []).map((v) => (
                    <span key={v} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[10px]">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.is_active ?? true} onCheckedChange={(c) => setEditing((p) => ({ ...p!, is_active: c }))} />
                <Label>Template ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing?.id ? "Salvar alterações" : "Criar template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={!!testTarget} onOpenChange={(o) => !o && setTestTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SendHorizontal className="h-4 w-4 text-blue-500" />
              Testar envio de e-mail
            </DialogTitle>
            <DialogDescription>
              Envia o template <strong>{testTarget?.name}</strong> com variáveis de exemplo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Destinatário</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="exemplo@email.com"
              />
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800 space-y-1">
              <p className="font-semibold">✓ Domínio suaagenda.pro verificado no Resend</p>
              <p>Envio de <strong>noreply@suaagenda.pro</strong> para qualquer destinatário.</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>Variáveis substituídas por:</strong></p>
              <p>nome → "Profissional Teste" · dias_restantes → "3" · link_pagamento → "https://suaagenda.pro/plano"</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTestTarget(null)}>Cancelar</Button>
            <Button onClick={sendTest} disabled={testSending || !testEmail.includes("@")}>
              {testSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
              Enviar teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévia do template</DialogTitle>
            <DialogDescription>Variáveis substituídas por valores de exemplo.</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div
                className="prose prose-sm max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: preview.html.replace(/\n/g, "<br/>") }}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
