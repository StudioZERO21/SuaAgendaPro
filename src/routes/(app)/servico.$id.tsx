import { createFileRoute } from "@tanstack/react-router";
import { ServiceForm } from "@/components/service-form";

export const Route = createFileRoute("/(app)/servico/$id")({
  head: () => ({
    meta: [
      { title: "Editar serviço — SuaAgenda.Pro" },
      { name: "description", content: "Edite um serviço do catálogo." },
    ],
  }),
  component: EditService,
});

function EditService() {
  const { id } = Route.useParams();
  return <ServiceForm serviceId={id} />;
}
