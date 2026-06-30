import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/(site)/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — SuaAgenda.Pro" },
      { name: "description", content: "Termos e condições de uso da plataforma SuaAgenda.Pro." },
    ],
    links: [{ rel: "canonical", href: "/termos" }],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-5 py-16 prose prose-neutral dark:prose-invert">
        <h1>Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">Última atualização: junho de 2026</p>

        <h2>1. Aceitação</h2>
        <p>
          Ao criar conta ou usar a SuaAgenda.Pro, você concorda com estes Termos e com a{" "}
          <Link to="/privacidade">Política de Privacidade</Link>.
        </p>

        <h2>2. Serviço</h2>
        <p>
          Oferecemos software de agenda online para profissionais da beleza e bem-estar,
          incluindo página pública de agendamento, CRM de clientes, pagamentos e integrações.
        </p>

        <h2>3. Conta do profissional</h2>
        <ul>
          <li>Você é responsável pela veracidade dos dados cadastrados.</li>
          <li>Deve manter a senha em sigilo e notificar uso não autorizado.</li>
          <li>Assinaturas seguem plano contratado (trial, premium) com cobrança via Asaas.</li>
        </ul>

        <h2>4. Dados de clientes finais (operador LGPD)</h2>
        <p>
          Ao cadastrar clientes e receber agendamentos, você é <strong>controlador</strong> dos
          dados desses titulares. Compromete-se a:
        </p>
        <ul>
          <li>Informar clientes sobre o tratamento de dados.</li>
          <li>Obter consentimento para comunicações de marketing.</li>
          <li>Atender solicitações de direitos (acesso, exclusão, etc.).</li>
        </ul>
        <p>
          A plataforma processa esses dados apenas conforme suas instruções e este contrato.
        </p>

        <h2>5. Uso aceitável</h2>
        <p>É proibido usar a plataforma para spam, fraude, conteúdo ilegal ou tentativa de
          acesso não autorizado a sistemas.</p>

        <h2>6. Propriedade intelectual</h2>
        <p>
          A marca, software e design pertencem à SuaAgenda.Pro. Conteúdo que você publica
          (fotos, textos) permanece seu.
        </p>

        <h2>7. Limitação de responsabilidade</h2>
        <p>
          O serviço é fornecido &quot;como está&quot;. Não nos responsabilizamos por perdas
          indiretas. Pagamentos PIX pessoais entre profissional e cliente são de
          responsabilidade das partes.
        </p>

        <h2>8. Rescisão</h2>
        <p>
          Você pode encerrar a conta a qualquer momento em Privacidade e dados. Podemos
          suspender contas que violem estes termos.
        </p>

        <h2>9. Foro</h2>
        <p>Foro da comarca do domicílio do consumidor, conforme CDC, quando aplicável.</p>

        <h2>10. Contato</h2>
        <p>
          Dúvidas: <a href="mailto:oi@suaagenda.pro">oi@suaagenda.pro</a> · Privacidade:{" "}
          <a href="mailto:privacidade@suaagenda.pro">privacidade@suaagenda.pro</a>
        </p>
      </article>
    </SiteShell>
  );
}
