import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * ExemploPagina Page
 * 
 * Gerado automaticamente do Lovable
 * Data: 2026-06-21
 */

export const Route = createFileRoute("/(public)/exemplo-pagina")({
  head: () => ({
    meta: [
      { title: "ExemploPagina — SuaAgenda.Pro" },
      { name: "description", content: "Página de ExemploPagina." },
    ],
  }),
  component: ExemploPaginaPage,
});

function ExemploPaginaPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      <div className="min-h-screen bg-white p-4">
  <div className="max-w-md mx-auto">
    <h1 className="text-3xl font-bold mb-4">Título da Página</h1>
    <p className="text-gray-600 mb-6">Descrição da página</p>
    <button className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700">Botão</button>
  </div>
</div>
    </motion.div>
  );
}

export default ExemploPaginaPage;
