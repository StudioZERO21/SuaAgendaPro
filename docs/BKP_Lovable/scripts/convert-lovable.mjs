#!/usr/bin/env node

/**
 * CONVERSOR AUTOMÁTICO: Lovable HTML → React TypeScript
 * 
 * Uso:
 * 1. Crie arquivo: lovable-export.json com seu HTML/CSS
 * 2. Execute: npm run convert:lovable
 * 3. Pronto! Componentes React criados automaticamente
 * 
 * Instalação:
 * Adicione em package.json:
 * "convert:lovable": "node scripts/convert-lovable.mjs"
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// MAPEAMENTO: Tags HTML → Componentes React
// ============================================================================

const componentMap = {
  'button': { component: 'Button', import: '@/components/ui/button' },
  'input': { component: 'Input', import: '@/components/ui/input' },
  'textarea': { component: 'Textarea', import: '@/components/ui/textarea' },
  'select': { component: 'Select', import: '@/components/ui/select' },
  'div': 'div',
  'section': 'section',
  'header': 'header',
  'main': 'main',
  'footer': 'footer',
  'nav': 'nav',
  'form': 'form',
  'label': 'label',
  'h1': 'h1',
  'h2': 'h2',
  'h3': 'h3',
  'p': 'p',
  'span': 'span',
  'a': 'a',
  'ul': 'ul',
  'ol': 'ol',
  'li': 'li',
};

// ============================================================================
// MAPEAMENTO: Classes Tailwind
// ============================================================================

const tailwindMap = {
  'bg-white': 'bg-white',
  'bg-gray-100': 'bg-gray-100',
  'bg-primary': 'bg-primary',
  'text-white': 'text-white',
  'text-gray-900': 'text-gray-900',
  'text-gray-600': 'text-gray-600',
  'rounded-lg': 'rounded-lg',
  'rounded-md': 'rounded-md',
  'p-4': 'p-4',
  'p-6': 'p-6',
  'px-4': 'px-4',
  'py-2': 'py-2',
  'mb-4': 'mb-4',
  'mt-4': 'mt-4',
  'flex': 'flex',
  'gap-4': 'gap-4',
  'grid': 'grid',
  'shadow-sm': 'shadow-sm',
  'shadow-md': 'shadow-md',
  'border': 'border',
  'border-gray-200': 'border-gray-200',
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function extractClasses(html) {
  const classRegex = /class="([^"]*)"/g;
  const classes = [];
  let match;
  while ((match = classRegex.exec(html)) !== null) {
    classes.push(...match[1].split(' '));
  }
  return [...new Set(classes)];
}

function extractIds(html) {
  const idRegex = /id="([^"]*)"/g;
  const ids = [];
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

function simplifyHTML(html) {
  // Remove scripts e estilos inline
  html = html.replace(/<script[^>]*>.*?<\/script>/gs, '');
  html = html.replace(/<style[^>]*>.*?<\/style>/gs, '');
  
  // Remove atributos desnecessários
  html = html.replace(/onclick="[^"]*"/g, '');
  html = html.replace(/oninput="[^"]*"/g, '');
  html = html.replace(/style="[^"]*"/g, '');
  
  return html;
}

function detectComponents(html) {
  const components = new Set();
  
  if (html.includes('<button')) components.add('Button');
  if (html.includes('<input')) components.add('Input');
  if (html.includes('<textarea')) components.add('Textarea');
  if (html.includes('<select')) components.add('Select');
  if (html.match(/class="[^"]*rounded[^"]*/)) components.add('Card');
  if (html.match(/class="[^"]*shadow[^"]*/)) components.add('Card');
  if (html.includes('<form')) components.add('Form');
  
  return Array.from(components);
}

function generateImports(components) {
  const imports = new Set();
  
  components.forEach(comp => {
    const mapping = componentMap[comp.toLowerCase()];
    if (mapping && typeof mapping === 'object') {
      imports.add(`import { ${mapping.component} } from "${mapping.import}";`);
    }
  });
  
  return Array.from(imports).join('\n');
}

function convertHTMLtoJSX(html) {
  // Converter self-closing tags
  html = html.replace(/<input([^>]*)>/g, '<Input$1 />');
  html = html.replace(/<br\s*\/?>/g, '<br />');
  html = html.replace(/<hr\s*\/?>/g, '<hr />');
  
  // Converter class para className
  html = html.replace(/class="/g, 'className="');
  
  // Converter for para htmlFor
  html = html.replace(/for="/g, 'htmlFor="');
  
  return html;
}

// ============================================================================
// GERADOR PRINCIPAL
// ============================================================================

function generateReactComponent(pageName, html, css) {
  const pascalName = toPascalCase(pageName);
  const routePath = pageName.toLowerCase();
  
  // Detectar componentes usados
  const detectedComponents = detectComponents(html);
  const imports = generateImports(detectedComponents);
  
  // Simplificar HTML
  const simplifiedHTML = simplifyHTML(html);
  const jsxHTML = convertHTMLtoJSX(simplifiedHTML);
  
  // Template React
  const template = `import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
${imports}

/**
 * ${pascalName} Page
 * 
 * Gerado automaticamente do Lovable
 * Data: ${new Date().toISOString().split('T')[0]}
 */

export const Route = createFileRoute("/${routePath}")({
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
      ${jsxHTML}
    </motion.div>
  );
}

export default ${pascalName}Page;
`;

  return template;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const exportFile = 'lovable-export.json';
  
  console.log('\n🚀 Conversor Automático - Lovable HTML → React\n');
  console.log('=' .repeat(50));
  
  // Verificar se arquivo existe
  if (!fs.existsSync(exportFile)) {
    console.error(`\n❌ Erro: Arquivo '${exportFile}' não encontrado!\n`);
    console.log('📋 Como usar:\n');
    console.log('1. Copie o HTML do Lovable (DevTools → Inspect)');
    console.log('2. Crie arquivo: lovable-export.json\n');
    console.log('3. Cole este conteúdo:\n');
    console.log(`{
  "pageName": "dashboard-novo",
  "html": "<div>...HTML aqui...</div>",
  "css": "/* CSS aqui (opcional) */"
}\n`);
    console.log('4. Execute: npm run convert:lovable\n');
    process.exit(1);
  }
  
  // Ler arquivo
  const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf-8'));
  
  const { pageName, html, css = '' } = exportData;
  
  if (!pageName || !html) {
    console.error('\n❌ Erro: Arquivo deve conter "pageName" e "html"\n');
    process.exit(1);
  }
  
  console.log(`\n📄 Processando: ${pageName}`);
  console.log(`📊 Tamanho HTML: ${html.length} caracteres`);
  
  // Gerar componente React
  console.log('\n⚙️  Gerando componente React...');
  const reactComponent = generateReactComponent(pageName, html, css);
  
  // Criar diretório se não existir
  const routesDir = 'src/routes';
  if (!fs.existsSync(routesDir)) {
    fs.mkdirSync(routesDir, { recursive: true });
  }
  
  // Salvar arquivo
  const filePath = path.join(routesDir, `${pageName}.tsx`);
  if (fs.existsSync(filePath)) {
    console.error(`\n❌ Erro: Arquivo já existe: ${filePath}`);
    process.exit(1);
  }
  
  fs.writeFileSync(filePath, reactComponent);
  console.log(`  ✅ Criado: ${filePath}`);
  
  // Criar documentação
  console.log('\n📚 Criando documentação...');
  const docsContent = `# ${toPascalCase(pageName)}

Gerado automaticamente do Lovable em: ${new Date().toISOString().split('T')[0]}

## Arquivo
- \`src/routes/${pageName}.tsx\`

## Próximos passos
1. Abra o arquivo e revise
2. \`npm run dev\` para testar
3. \`npm run type-check\` para validar
4. Commit com: \`git commit -m "feat: auto-convert ${pageName} from Lovable"\`

## Componentes usados
${detectComponents(html).map(c => `- ${c}`).join('\n')}

## Classes Tailwind
${extractClasses(html).slice(0, 10).map(c => `- ${c}`).join('\n')}

---

**Convertido automaticamente | Rose Schedule Chic**
`;
  
  if (!fs.existsSync('docs')) {
    fs.mkdirSync('docs', { recursive: true });
  }
  
  fs.writeFileSync(`docs/${pageName}.md`, docsContent);
  console.log(`  ✅ Criado: docs/${pageName}.md`);
  
  // Resumo final
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ CONVERSÃO CONCLUÍDA!\n');
  
  console.log('📋 Arquivos gerados:');
  console.log(`  ✅ src/routes/${pageName}.tsx`);
  console.log(`  ✅ docs/${pageName}.md`);
  
  console.log('\n🚀 Próximos passos:\n');
  console.log('  1. npm run dev                 (testar no navegador)');
  console.log('  2. npm run type-check          (validar TypeScript)');
  console.log(`  3. git commit -m "feat: auto-convert ${pageName}"\n`);
  
  console.log('✨ Pronto para usar!\n');
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
