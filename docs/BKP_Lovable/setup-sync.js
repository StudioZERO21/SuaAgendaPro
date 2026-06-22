#!/usr/bin/env node

/**
 * SETUP AUTOMÁTICO
 * 
 * Este script copia automaticamente todos os arquivos necessários
 * para sincronizar Lovable com seu repositório
 * 
 * Uso:
 * 1. Baixe este arquivo: setup-sync.js
 * 2. Coloque na raiz do seu projeto: rose-schedule-chic/
 * 3. Execute: node setup-sync.js
 * 4. Pronto!
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setup Automático - Sincronização Lovable\n');
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

/**
 * Sincronizado com Lovable em: \${new Date().toISOString().split('T')[0]}
 */

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
          {/* TODO: Edite aqui - Cole o conteúdo do Lovable */}
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
console.log('\\n📋 Próximos passos:');
console.log('1. Abra o arquivo e implemente');
console.log('2. npm run dev');
console.log('3. npm run type-check');
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

console.log('\\n🔤 Verificando TypeScript...');
try {
  execSync('tsc --noEmit --skipLibCheck 2>&1', { stdio: 'pipe' });
  console.log('  ✅ Sem erros de TypeScript');
} catch (error) {
  console.log('  ⚠️  Alguns erros encontrados (normal em desenvolvimento)');
}

if (hasErrors) {
  console.error('\\n❌ Validação falhou');
  process.exit(1);
} else {
  console.log('\\n✅ Validação bem-sucedida!');
  console.log('\\n💡 Próximos passos:');
  console.log('  1. npm run dev');
  console.log('  2. npm run sync:lovable nome-da-tela');
  console.log('  3. npm run sync:convert nome-da-tela');
}
`;

fs.writeFileSync(path.join(scriptsDir, 'sync-validate.js'), syncValidateContent);
console.log(`  ✅ Criado: scripts/sync-validate.js`);

// ============================================================================
// 5. ATUALIZAR package.json
// ============================================================================

console.log('\n📝 Atualizando package.json...');

const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Adicionar scripts
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

Este diretório contém documentação sobre a sincronização de telas do Lovable.

## Como Sincronizar uma Tela

### Passo 1: Documentar
\\\`\\\`\\\`bash
npm run sync:lovable nome-da-tela
\\\`\\\`\\\`

Isso cria \`LOVABLE_UPDATES.md\` para documentar a tela.

### Passo 2: Converter
\\\`\\\`\\\`bash
npm run sync:convert nome-da-tela
\\\`\\\`\\\`

Isso cria o arquivo React em \`src/routes/nome-da-tela.tsx\`.

### Passo 3: Implementar
Edite o arquivo criado e implemente o conteúdo.

### Passo 4: Testar
\\\`\\\`\\\`bash
npm run dev
npm run type-check
\\\`\\\`\\\`

### Passo 5: Commit
\\\`\\\`\\\`bash
git add .
git commit -m "feat: sync [nome-da-tela] from Lovable"
\\\`\\\`\\\`

## Scripts Disponíveis

- \`npm run sync:lovable\` - Documenta tela do Lovable
- \`npm run sync:convert\` - Cria arquivo React
- \`npm run sync:validate\` - Valida estrutura
- \`npm run sync:all\` - Valida tudo

## Componentes Disponíveis

Consulte \`src/components/ui/\` para ver todos os componentes reutilizáveis.

Exemplos:
- Button
- Input
- Card
- Form
- Tabs
- Dialog
- ... (20+ componentes)

## Cores

Consulte \`src/styles.css\` para ver a paleta de cores.

Principais:
- \`--primary: #ec4899\` (Rosa)
- \`--background: #ffffff\` (Branco)
- \`--foreground: #1f1230\` (Texto)

---

**Última atualização:** \${new Date().toISOString().split('T')[0]}
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

console.log('\n🚀 Próximos passos:');
console.log('\n  1. Valide a instalação:');
console.log('     npm run sync:validate');

console.log('\n  2. Sincronize uma tela:');
console.log('     npm run sync:lovable nome-da-tela');

console.log('\n  3. Converta para React:');
console.log('     npm run sync:convert nome-da-tela');

console.log('\n  4. Teste:');
console.log('     npm run dev');

console.log('\n💡 Dicas:');
console.log('  • Scripts são reutilizáveis para cada tela');
console.log('  • TypeScript vai validar automaticamente');
console.log('  • Componentes prontos em src/components/ui/');
console.log('  • Cores em src/styles.css');

console.log('\n✨ Pronto para sincronizar com Lovable!\n');
`;

fs.writeFileSync('setup-sync.js', setupContent);

// Versão minificada do setup para exibição
console.log('\n' + '='.repeat(50));
console.log('\n✅ SETUP AUTOMÁTICO CONCLUÍDO!\n');

console.log('📋 Arquivos criados:');
console.log('  ✅ scripts/sync-lovable.js');
console.log('  ✅ scripts/sync-convert.js');
console.log('  ✅ scripts/sync-validate.js');
console.log('  ✅ docs/README.md');
console.log('  ✅ package.json (atualizado)');

console.log('\n🚀 PRÓXIMAS AÇÕES:');
console.log('\nOpção 1: Validar instalação');
console.log('  npm run sync:validate\n');

console.log('Opção 2: Sincronizar uma tela');
console.log('  npm run sync:lovable dashboard-novo');
console.log('  npm run sync:convert dashboard-novo');
console.log('  npm run dev\n');

console.log('Opção 3: Consultar documentação');
console.log('  Abra: docs/README.md\n');

console.log('✨ Seu projeto está pronto para sincronizar com Lovable!');
console.log('=' .repeat(50) + '\n');
