import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/(site)/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — SuaAgenda.Pro" },
      { name: "description", content: "Como tratamos seus dados pessoais em conformidade com a LGPD." },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-5 py-16 prose prose-neutral dark:prose-invert">
        <h1>Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">Última atualização: junho de 2026</p>

        <h2>1. Quem somos</h2>
        <p>
          A <strong>SuaAgenda.Pro</strong> (&quot;nós&quot;, &quot;plataforma&quot;) é controladora dos
          dados dos profissionais que criam conta na plataforma. Para dados de clientes finais
          agendados pelos profissionais, o profissional é o controlador e nós atuamos como
          operador, processando dados em seu nome.
        </p>
        <p>
          <strong>Encarregado (DPO):</strong>{" "}
          <a href="mailto:privacidade@suaagenda.pro">privacidade@suaagenda.pro</a>
        </p>

        <h2>2. Dados que coletamos</h2>
        <ul>
          <li><strong>Profissionais:</strong> nome, e-mail, telefone, endereço, foto, dados de pagamento da assinatura.</li>
          <li><strong>Clientes finais:</strong> nome, telefone, e-mail, data de nascimento (opcional), histórico de agendamentos.</li>
          <li><strong>Técnicos:</strong> logs de acesso (sem IP), navegador/dispositivo, cookies essenciais de sessão.</li>
        </ul>

        <h2>3. Finalidades e bases legais (LGPD)</h2>
        <ul>
          <li>Execução de contrato — prestação do serviço de agenda.</li>
          <li>Consentimento — marketing via WhatsApp, quando aplicável.</li>
          <li>Legítimo interesse — segurança, prevenção a fraudes e melhoria do serviço.</li>
          <li>Obrigação legal — registros fiscais e resposta a autoridades.</li>
        </ul>

        <h2>4. Compartilhamento</h2>
        <p>
          Compartilhamos dados com subprocessadores listados em nossa{" "}
          <Link to="/termos">documentação de termos</Link> e matriz interna (Supabase, Asaas,
          Mercado Pago, Resend, Evolution API, Google). Não vendemos dados pessoais.
        </p>

        <h2>5. Seus direitos (Art. 18 LGPD)</h2>
        <p>
          Você pode solicitar confirmação, acesso, correção, exclusão, portabilidade e
          revogação de consentimento. Profissionais: acesse{" "}
          <Link to="/privacidade-dados">Privacidade e dados</Link> no app. Clientes finais:{" "}
          <Link to="/dsar">formulário de solicitação</Link> ou contato com o profissional.
        </p>

        <h2>6. Retenção</h2>
        <p>
          Mantemos dados enquanto a conta estiver ativa. Logs de atividade: 12 meses.
          Mensagens WhatsApp: 24 meses. Após exclusão, anonimizamos ou removemos conforme
          obrigações legais.
        </p>

        <h2>7. Segurança</h2>
        <p>
          Utilizamos criptografia em trânsito (HTTPS), controle de acesso (RLS), autenticação
          segura e auditoria de ações administrativas.
        </p>

        <h2>8. Menores</h2>
        <p>
          A plataforma é destinada a profissionais maiores de 18 anos. Dados de menores
          atendidos pelos profissionais são responsabilidade do profissional controlador.
        </p>

        <h2>9. Alterações</h2>
        <p>Notificaremos alterações relevantes por e-mail ou aviso no app.</p>
      </article>
    </SiteShell>
  );
}
