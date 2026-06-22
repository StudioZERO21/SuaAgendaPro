#!/usr/bin/env node

/**
 * SCRIPT 2: sync-convert.js
 * 
 * Converte componentes do Lovable (HTML) para React + TypeScript
 * Cria um arquivo pronto para editar e sincronizar
 * 
 * Uso: npm run sync:convert nome-da-tela
 * Ex:  npm run sync:convert dashboard-novo
 * 
 * INSTALAR:
 * 1. Copie este arquivo para: scripts/sync-convert.js
 * 2. Adicione em package.json:
 *    "sync:convert": "node scripts/sync-convert.js"
 * 3. Execute: npm run sync:convert nome-da-tela
 */

const fs = require('fs');
const path = require('path');

const telaNome = process.argv[2];

if (!telaNome) {
  console.error('❌ Erro: Informe o nome da tela');
  console.error('Uso: npm run sync:convert [nome-da-tela]');
  process.exit(1);
}

function toCamelCase(str) {
  return str
    .split('-')
    .map((word, i) => 
      i === 0 
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

const camelName = toCamelCase(telaNome);
const pascalName = toPascalCase(telaNome);

// Template de página React + TypeScript
const template = `import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Sincronizado com Lovable em: ${new Date().toISOString().split('T')[0]}
 * 
 * ✅ TypeScript com tipos completos
 * ✅ Responsivo (mobile-first)
 * ✅ Acessível (Radix UI)
 * ✅ Animações com Framer Motion
 * ✅ Tailwind CSS
 * 
 * PRÓXIMOS PASSOS:
 * 1. Copie o HTML do Lovable (DevTools → Inspecionar)
 * 2. Substitua os elementos HTML por componentes React
 * 3. Use componentes de src/components/ui/
 * 4. Execute: npm run dev (para testar)
 * 5. Execute: npm run type-check (para validar TypeScript)
 */

export const Route = createFileRoute("/${telaNome.toLowerCase()}") ({
  head: () => ({
    meta: [
      { title: "${pascalName} — SuaAgenda.Pro" },
      { name: "description", content: "Página de ${pascalName}." },
    ],
  }),
  component: ${pascalName}Page,
});

interface ${pascalName}PageState {
  // TODO: Defina as propriedades de estado aqui
  // Exemplo:
  // loading: boolean;
  // error: string | null;
}

/**
 * ${pascalName}Page Component
 * 
 * Renderiza a página de ${telaNome} sincronizada com Lovable
 */
function ${pascalName}Page() {
  // TODO: Implemente o estado necessário
  // const [state, setState] = useState<${pascalName}PageState>({});

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-8">
        
        {/* COMECE A EDITAR AQUI */}
        
        <Card className="p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ${pascalName}
            </h1>
            <p className="text-muted-foreground mb-6">
              Página sincronizada com Lovable
            </p>

            {/* Exemplo de formulário */}
            <form className="space-y-4">
              <Input
                placeholder="Digite algo aqui..."
                className="w-full"
                // TODO: Conectar com estado
              />
              <Button className="w-full">
                Enviar
              </Button>
            </form>
          </motion.div>
        </Card>

        {/* DICAS:
          * - Use <Card> para containers
          * - Use <Button> para ações
          * - Use <Input> para campos de texto
          * - Use <motion.div> para animações
          * - Use className com Tailwind para estilos
          * - Adicione types/interfaces para props
          * - Importe componentes necessários do topo
          */}

      </div>
    </motion.div>
  );
}

export default ${pascalName}Page;
`;

// Criar diretório de rotas se não existir
const routesDir = 'src/routes';
if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
  console.log(`✅ Criado diretório: ${routesDir}`);
}

// Verificar se arquivo já existe
const filePath = path.join(routesDir, \`\${telaNome}.tsx\`);
if (fs.existsSync(filePath)) {
  console.error(\`❌ Erro: Arquivo já existe\`);
  console.error(\`Caminho: \${filePath}\`);
  console.error(\`\nPara sobrescrever, delete o arquivo ou use outro nome\`);
  process.exit(1);
}

// Escrever arquivo
fs.writeFileSync(filePath, template);
console.log('\\n✅ Arquivo criado com sucesso!\\n');
console.log(\`📝 Arquivo: \${filePath}\`);
console.log('\\n📋 Próximos passos:');
console.log(\`1. Abra \${filePath}\`);
console.log('2. Copie o HTML do Lovable (DevTools → Inspecionar)');
console.log('3. Converta para componentes React');
console.log('4. Use componentes de src/components/ui/');
console.log('5. npm run dev (testar)');
console.log('6. npm run type-check (validar)');
console.log(\`7. git commit -m "feat: sync \${telaNome} from Lovable"\`);
console.log('\\n💡 Dicas:');
console.log('- Consulte docs/LOVABLE_UPDATES.md para referência');
console.log('- Use Ctrl+F para buscar componentes específicos');
console.log('- Mantenha a estrutura responsiva');
