import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ShieldAlert,
  CreditCard,
  DollarSign,
  ClipboardList,
  MessageSquare,
  Settings,
  Server,
  TicketCheck,
  Share2,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { clearSuperAuth, getSuperAuth } from "@/lib/super-auth";
import { cn } from "@/lib/utils";

const NAV_PRINCIPAL = [
  { title: "Dashboard",  to: "/super",           icon: LayoutDashboard, exact: true },
  { title: "Usuários",   to: "/super/usuarios",  icon: Users,           exact: false },
  { title: "Planos",     to: "/super/planos",    icon: CreditCard,      exact: false },
  { title: "Financeiro", to: "/super/financeiro",icon: DollarSign,      exact: false },
  { title: "Tickets",    to: "/super/tickets",    icon: TicketCheck,     exact: false },
  { title: "Indicações", to: "/super/indicacoes", icon: Share2,          exact: false },
];

const NAV_SISTEMA = [
  { title: "Templates",    to: "/super/templates",    icon: MessageSquare,  exact: false },
  { title: "Auditoria",    to: "/super/auditoria",    icon: ClipboardList,  exact: false },
  { title: "Infra",        to: "/super/infra",        icon: Server,         exact: false },
  { title: "Configurações",to: "/super/configuracoes",icon: Settings,       exact: false },
  { title: "Meu 2FA",      to: "/super/mfa-setup",   icon: ShieldCheck,    exact: false },
];

export function SuperSidebar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const auth = getSuperAuth();

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  function handleSignOut() {
    clearSuperAuth();
    navigate({ to: "/super/login", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-glow">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold leading-tight">
              Super Admin
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Painel de controle
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_PRINCIPAL.map((item) => {
                const active = isActive(item.to, item.exact);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link
                        to={item.to}
                        className={cn("flex items-center gap-2", active && "font-semibold")}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_SISTEMA.map((item) => {
                const active = isActive(item.to, item.exact);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link
                        to={item.to}
                        className={cn("flex items-center gap-2", active && "font-semibold")}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:p-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
            S
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold">Super Admin</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {auth ? "autenticado" : "—"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sair"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
