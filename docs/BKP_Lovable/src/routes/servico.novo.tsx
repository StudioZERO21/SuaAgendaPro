import { createFileRoute } from "@tanstack/react-router";
import { ServiceForm } from "@/components/service-form";

export const Route = createFileRoute("/servico/novo")({
  head: () => ({
    meta: [
      { title: "Novo serviço — SuaAgenda.Pro" },
      { name: "description", content: "Cadastre um novo serviço." },
    ],
  }),
  component: () => <ServiceForm />,
});
