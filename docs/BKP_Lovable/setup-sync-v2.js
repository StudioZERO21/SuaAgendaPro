#!/usr/bin/env node

/**
 * SETUP AUTOMÁTICO - SINCRONIZAÇÃO LOVABLE
 * 
 * Este script copia automaticamente todos os arquivos necessários
 * para sincronizar Lovable com seu repositório
 * 
 * Uso:
 * 1. Coloque este arquivo na raiz do seu projeto
 * 2. Execute: node setup-sync.js
 * 3. Pronto!
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 Setup Automático - Sincronização Lovable\n');
console.log('=' .repeat(50));

// ============================================================================
// 1. CRIAR DIRETÓRIO scripts/
// ============================================================================

console.log('\n📁 Criando estrutura de pastas...');

const scriptsDir = 'scripts';
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
  console.log(`  ✅ Criado: ${scriptsDir}/`);
} else {
  console.log(`  ✅ Já existe: ${scriptsDir}/`);
}

// ============================================================================
// 2. CRIAR ARQUIVO: sync-lovable.js
// ============================================================================

const syncLovableContent = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const telaNome = process.argv[2];

if (!telaNome) {
  console.error('❌ Erro: Informe o nome da tela');
  console.error('Uso: npm run sync:lovable [nome-da-tela]');
  console.error('Ex:  npm run sync:lovable dashboard-novo');
  process.exit(1);
}

if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs', { recursive: true });
}

const docsPath = 'docs/LOVABLE_UPDATES.md';
const timestamp = new Date().toISOString().split('T')[0];
const hora = new Date().toLocaleTimeString('pt-BR');

const content = \`# 🔄 Update: \${telaNome}
**Data:** \${timestamp} \${hora}

## Informações
- **Nome da tela:** \${telaNome}
- **Status:** 🔄 Em sincronização
- **Data criação:** \${timestamp}

## Passo 1: Documentação

### Componentes Extraídos
- [ ] Button
- [ ] Input
- [ ] Card
- [ ] Outros: ___________

### Cores Utilizadas
- Primária: #________
- Secundária: #________
- Fundo: #________
- Texto: #________

### Espaçamento
- Padding card: ___px
- Gap: ___px
- Margin: ___px

## Passo 2: Converter
\\\`\\\`\\\`bash
npm run sync:convert \${telaNome}
\\\`\\\`\\\`

## Próximos passos
1. Edite src/routes/\${telaNome}.tsx
2. npm run dev
3. npm run type-check
4. git commit
\`;

fs.writeFileSync(docsPath, content);
console.log('✅ Documentação criada!');
console.log(\`📝 Arquivo: \${docsPath}\`);
console.log('\\n📋 Próximos passos:');
console.log('1. Abra o arquivo e preencha os detalhes');
console.log('2. Inspecione a tela no Lovable');
console.log(\`3. Execute: npm run sync:convert \${telaNome}\`);
`;

fs.writeFileSync(path.join(scriptsDir, 'sync-lovable.js'), syncLovableContent);
console.log(`  ✅ Criado: scripts/sync-lovable.js`);

// ============================================================================
// 3. CRIAR ARQUIVO: sync-convert.js
// ============================================================================

const syncConvertContent = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const telaNome = process.argv[2];

if (!telaNome) {
  console.error('❌ Erro: Informe o nome da tela');
  console.error('Uso: npm run sync:convert [nome-da-tela]');
  process.exit(1);
}

function toCamelCase(str) {
  return str.split('-').map((word, i) => 
    i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

function toPascalCase(str) {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
}

const camelName = toCamelCase(telaNome);
const pascalName = toPascalCase(telaNome);

const template = \`import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/\${telaNome.toLowerCase()}")({
  head: () => ({
    meta: [
      { title: "\${pascalName} — SuaAgenda.Pro" },
      { name: "description", content: "Página de \${pascalName}." },
    ],
  }),
  component: \${pascalName}Page,
});

function \${pascalName}Page() {
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
            \${pascalName}
          </h1>
          <p className="text-muted-foreground">
            Página sincronizada com Lovable
          </p>
        </Card>
      </div>
    </motion.div>
  );
}

export default \${pascalName}Page;
\`;

const routesDir = 'src/routes';
if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
}

const filePath = path.join(routesDir, \`\${telaNome}.tsx\`);
if (fs.existsSync(filePath)) {
  console.error(\`❌ Erro: Arquivo já existe: \${filePath}\`);
  process.exit(1);
}

fs.writeFileSync(filePath, template);
console.log('✅ Arquivo criado!');
console.log(\`📝 Arquivo: \${filePath}\`);
`;

fs.writeFileSync(path.join(scriptsDir, 'sync-convert.js'), syncConvertContent);
console.log(`  ✅ Criado: scripts/sync-convert.js`);

// ============================================================================
// 4. CRIAR ARQUIVO: sync-validate.js
// ============================================================================

const syncValidateContent = `#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Validando sincronização...\\n');

let hasErrors = false;

console.log('📁 Verificando estrutura...');
const dirs = ['src', 'src/routes', 'src/components', 'docs'];
dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(\`  ✅ \${dir}\`);
  } else {
    console.error(\`  ❌ Faltando: \${dir}\`);
    hasErrors = true;
  }
});

console.log('\\n📄 Verificando arquivos...');
const files = ['package.json', 'tsconfig.json', 'src/styles.css'];
files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(\`  ✅ \${file}\`);
  } else {
    console.error(\`  ❌ Faltando: \${file}\`);
    hasErrors = true;
  }
});

console.log('\\n✅ Validação completa!\\n');
console.log('💡 Próximos passos:');
console.log('  1. npm run dev');
console.log('  2. npm run sync:lovable nome-da-tela');
console.log('  3. npm run sync:convert nome-da-tela');
`;

fs.writeFileSync(path.join(scriptsDir, 'sync-validate.js'), syncValidateContent);
console.log(`  ✅ Criado: scripts/sync-validate.js`);

// ============================================================================
// 5. ATUALIZAR package.json
// ============================================================================

console.log('\n📝 Atualizando package.json...');

const packageJsonPath = 'package.json';
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Erro: package.json não encontrado na raiz do projeto!');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const newScripts = {
  'sync:lovable': 'node scripts/sync-lovable.js',
  'sync:convert': 'node scripts/sync-convert.js',
  'sync:validate': 'node scripts/sync-validate.js',
  'sync:all': 'npm run sync:validate && npm run type-check',
};

packageJson.scripts = {
  ...packageJson.scripts,
  ...newScripts,
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('  ✅ Scripts adicionados ao package.json');

// ============================================================================
// 6. CRIAR docs/README.md
// ============================================================================

console.log('\n📚 Criando documentação...');

const docsDir = 'docs';
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const docsReadme = `# 📚 Documentação de Sincronização

## Como Sincronizar uma Tela

### Passo 1: Documentar
\`\`\`bash
npm run sync:lovable nome-da-tela
\`\`\`

### Passo 2: Converter
\`\`\`bash
npm run sync:convert nome-da-tela
\`\`\`

### Passo 3: Editar
Abra \`src/routes/nome-da-tela.tsx\` e implemente.

### Passo 4: Testar
\`\`\`bash
npm run dev
npm run type-check
\`\`\`

### Passo 5: Commit
\`\`\`bash
git add .
git commit -m "feat: sync [nome] from Lovable"
\`\`\`

## Scripts Disponíveis

- \`npm run sync:lovable\` - Documenta tela
- \`npm run sync:convert\` - Cria arquivo React
- \`npm run sync:validate\` - Valida estrutura
- \`npm run sync:all\` - Valida tudo

---

Sincronização Lovable - ${new Date().toISOString().split('T')[0]}
`;

fs.writeFileSync(path.join(docsDir, 'README.md'), docsReadme);
console.log('  ✅ Criado: docs/README.md');

// ============================================================================
// 7. RESUMO FINAL
// ============================================================================

console.log('\n' + '='.repeat(50));
console.log('\n✅ SETUP COMPLETO!\n');

console.log('📋 Arquivos criados:');
console.log('  ✅ scripts/sync-lovable.js');
console.log('  ✅ scripts/sync-convert.js');
console.log('  ✅ scripts/sync-validate.js');
console.log('  ✅ docs/README.md');
console.log('  ✅ package.json (atualizado)');

console.log('\n🚀 Próximos passos:\n');
console.log('  1. Valide a instalação:');
console.log('     npm run sync:validate\n');

console.log('  2. Sincronize uma tela:');
console.log('     npm run sync:lovable nome-da-tela\n');

console.log('  3. Converta para React:');
console.log('     npm run sync:convert nome-da-tela\n');

console.log('  4. Teste:');
console.log('     npm run dev\n');

console.log('✨ Pronto para sincronizar com Lovable!\n');
console.log('='.repeat(50) + '\n');
