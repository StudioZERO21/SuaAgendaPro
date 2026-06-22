import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Sun, Moon, Monitor, Upload, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/personalizacao")({
  head: () => ({
    meta: [
      { title: "Personalização — SuaAgenda.Pro" },
      {
        name: "description",
        content: "Personalize tema, cores e logo do seu negócio.",
      },
    ],
  }),
  component: PersonalizacaoPage,
});

import {
  ACCENTS,
  FONTS,
  DEFAULTS,
  loadPersonalization,
  savePersonalization,
  applyPersonalization,
  type Personalization,
} from "@/lib/personalization";

function PersonalizacaoPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Personalization>(DEFAULTS);

  useEffect(() => {
    const loaded = loadPersonalization();
    setData(loaded);
    applyPersonalization(loaded);
  }, []);

  // Live preview: apply theme/accent/font as user changes them
  useEffect(() => {
    applyPersonalization(data);
  }, [data.theme, data.accent, data.font, data.highContrast]);

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () =>
      setData((d) => ({ ...d, business: { ...d.business, logo: r.result as string } }));
    r.readAsDataURL(file);
    e.target.value = "";
  }

  function save() {
    if (!data.business.name.trim()) {
      toast.error("Informe o nome do negócio");
      return;
    }
    savePersonalization(data);
    applyPersonalization(data);
    toast.success("Personalização salva!");
  }

  const initials = data.business.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <MobileShell>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/mais" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ajustes
          </p>
          <h1 className="truncate font-display text-lg font-bold">Personalização</h1>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5 pb-32 pt-5">
        {/* Logo + nome */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Logo do negócio</h2>
            <p className="text-xs text-muted-foreground">
              Aparece no seu link público e nas comunicações.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white shadow-glow"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--primary-glow))",
              }}
            >
              {data.business.logo ? (
                <img
                  src={data.business.logo}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials || "S"}</span>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold">
                <Upload className="h-3.5 w-3.5" />
                {data.business.logo ? "Trocar logo" : "Enviar logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onLogo}
                />
              </label>
              {data.business.logo && (
                <button
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      business: { ...d.business, logo: "" },
                    }))
                  }
                  className="ml-2 text-[11px] font-semibold text-destructive"
                >
                  remover
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bname">Nome do negócio</Label>
            <Input
              id="bname"
              value={data.business.name}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  business: { ...d.business, name: e.target.value },
                }))
              }
            />
          </div>
        </section>

        {/* Tema */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Tema e cores</h2>
            <p className="text-xs text-muted-foreground">
              Defina como o app aparece para você.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "light", label: "Claro", icon: Sun },
                { id: "dark", label: "Escuro", icon: Moon },
                { id: "auto", label: "Auto", icon: Monitor },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              const active = data.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setData((d) => ({ ...d, theme: t.id }))}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-semibold transition",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/40 text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Cor de destaque</Label>
            <div className="flex flex-wrap gap-3">
              {ACCENTS.map((a) => {
                const active = data.accent === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setData((d) => ({ ...d, accent: a.id }))}
                    aria-label={a.label}
                    className={cn(
                      "relative h-10 w-10 rounded-full ring-offset-2 ring-offset-card transition",
                      active && "ring-2 ring-foreground",
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${a.primary}, ${a.glow})`,
                    }}
                  >
                    {active && (
                      <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Fonte de títulos</Label>
            <div className="grid grid-cols-3 gap-2">
              {FONTS.map((f) => {
                const active = data.font === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setData((d) => ({ ...d, font: f.id }))}
                    className={cn(
                      "rounded-2xl border p-3 text-center transition",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/40",
                    )}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ fontFamily: f.stack }}
                    >
                      Aa
                    </p>

                    <p className="text-[10px] font-semibold text-muted-foreground">
                      {f.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Acessibilidade */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Acessibilidade</h2>
            <p className="text-xs text-muted-foreground">
              Ajustes para melhorar a leitura e a navegação.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setData((d) => ({ ...d, highContrast: !d.highContrast }))
            }
            aria-pressed={data.highContrast}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
              data.highContrast
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/40",
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  data.highContrast ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                )}
                aria-hidden="true"
              >
                <Eye className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Alto contraste
                </span>
                <span className="block text-xs text-muted-foreground">
                  Bordas marcadas, foco visível e texto reforçado.
                </span>
              </span>
            </span>
            <span
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full border transition",
                data.highContrast ? "border-primary bg-primary" : "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all",
                  data.highContrast ? "left-[22px]" : "left-1",
                )}
              />
            </span>
          </button>
        </section>

        <p className="px-1 text-[11px] text-muted-foreground">
          Horários, notificações e pagamentos ficam nos seus respectivos menus em
          <strong> Mais</strong>.
        </p>

      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button
          onClick={save}
          size="lg"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
        >
          <Save className="mr-2 h-5 w-5" /> Salvar alterações
        </Button>
      </div>
    </MobileShell>
  );
}
