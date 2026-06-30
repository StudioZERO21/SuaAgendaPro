import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitDataSubjectRequest } from "@/lib/privacy.functions";

export const Route = createFileRoute("/(site)/dsar")({
  head: () => ({
    meta: [
      { title: "Seus dados — Solicitação LGPD" },
      { name: "description", content: "Exercite seus direitos como titular de dados (LGPD Art. 18)." },
    ],
  }),
  component: DsarPage,
});

function DsarPage() {
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<string>("access");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await submitDataSubjectRequest({
        data: {
          requestType: requestType as "access" | "rectification" | "deletion" | "portability" | "opposition",
          requesterName: fd.get("name") as string,
          requesterEmail: fd.get("email") as string,
          requesterPhone: (fd.get("phone") as string) || undefined,
          message: (fd.get("message") as string) || undefined,
        },
      });
      toast.success("Solicitação registrada!", {
        description: "Responderemos em até 15 dias úteis.",
      });
      e.currentTarget.reset();
    } catch {
      toast.error("Erro ao enviar. Tente privacidade@suaagenda.pro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-display text-3xl font-bold">Seus dados (LGPD)</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Clientes de profissionais: envie sua solicitação aqui. Se você é profissional
          cadastrado, use o app em Privacidade e dados.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label>Tipo de solicitação</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="access">Acesso aos meus dados</SelectItem>
                <SelectItem value="rectification">Correção de dados</SelectItem>
                <SelectItem value="deletion">Exclusão de dados</SelectItem>
                <SelectItem value="portability">Portabilidade</SelectItem>
                <SelectItem value="opposition">Oposição ao tratamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Detalhes</Label>
            <Textarea id="message" name="message" rows={4} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Enviando…" : "Enviar solicitação"}
          </Button>
        </form>
      </section>
    </SiteShell>
  );
}
