#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const telaNome = process.argv[2];

if (!telaNome) {
  console.error('❌ Erro: Informe o nome da tela');
  console.error('Uso: npm run sync:convert [nome-da-tela]');
  process.exit(1);
}

function toPascalCase(str) {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

const pascalName = toPascalCase(telaNome);

const template = `import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/${telaNome.toLowerCase()}")({
  head: () => ({
    meta: [
      { title: "${pascalName} — SuaAgenda.Pro" },
      { name: "description", content: "Página de ${pascalName}." },
    ],
  }),
  component: ${pascalName}Page,
});

function ${pascalName}Page() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ${pascalName}
          </h1>
          <p className="text-muted-foreground">
            Sincronizado com Lovable
          </p>
          {/* TODO: Edite aqui */}
        </Card>
      </div>
    </motion.div>
  );
}

export default ${pascalName}Page;
`;

const routesDir = 'src/routes';
if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
}

const filePath = path.join(routesDir, `${telaNome}.tsx`);
if (fs.existsSync(filePath)) {
  console.error(`❌ Arquivo já existe: ${filePath}`);
  process.exit(1);
}

fs.writeFileSync(filePath, template);
console.log('✅ Arquivo criado!');
console.log(`📝 Arquivo: ${filePath}`);
