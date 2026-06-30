import { Link } from "@tanstack/react-router";
import { Instagram, Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-gradient-to-b from-background to-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white shadow-glow">
              <Sparkles className="h-4 w-4" fill="currentColor" />
            </div>
            <span className="font-display text-lg font-bold">
              SuaAgenda<span className="text-gradient">.Pro</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            A agenda premium feita para profissionais da beleza que querem mais
            tempo, mais clientes e mais resultado.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Produto</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/recursos" className="hover:text-primary">Recursos</Link></li>
            <li><Link to="/precos" className="hover:text-primary">Preços</Link></li>
            <li><Link to="/cadastro" className="hover:text-primary">Criar conta</Link></li>
            <li><Link to="/login" className="hover:text-primary">Entrar</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Legal</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/privacidade" className="hover:text-primary">Privacidade</Link></li>
            <li><Link to="/termos" className="hover:text-primary">Termos de uso</Link></li>
            <li><Link to="/dsar" className="hover:text-primary">Seus dados (LGPD)</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contato</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/contato" className="hover:text-primary">Fale com a gente</Link></li>
            <li>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary">
                <Instagram className="h-4 w-4" /> @suaagenda.pro
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} SuaAgenda.Pro</span>
          <span>
            DPO:{" "}
            <a href="mailto:privacidade@suaagenda.pro" className="hover:text-primary">
              privacidade@suaagenda.pro
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
