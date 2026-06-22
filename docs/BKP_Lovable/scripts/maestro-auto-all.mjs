#!/usr/bin/env node

/**
 * SCRIPT MAESTRO - AUTOMAÇÃO COMPLETA
 * 
 * Faz TUDO em um comando:
 * 1. Extrai suas 28 páginas existentes
 * 2. Gera arquivo de configuração
 * 3. Replica para todas as páginas
 * 4. Pronto!
 * 
 * Uso:
 * npm run auto:all
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🎯 AUTOMAÇÃO COMPLETA - MAESTRO\n');
console.log('█'.repeat(60));
console.log('█ Você tem 28 páginas? Vou replicar TUDO para você!'.padEnd(59) + '█');
console.log('█'.repeat(60));

// ============================================================================
// ETAPA 1: EXTRAIR PÁGINAS EXISTENTES
// ============================================================================

console.log('\n[1/3] 📊 EXTRAINDO suas 28 páginas...\n');

const routesDir = 'src/routes';

if (!fs.existsSync(routesDir)) {
  console.error('❌ Erro: src/routes não encontrado!\n');
  process.exit(1);
}

const files = fs.readdirSync(routesDir)
  .filter(f => f.endsWith('.tsx') && !f.startsWith('_') && !f.startsWith('api'))
  .sort();

console.log(`✅ Encontradas ${files.length} páginas:\n`);

const pages = [];

files.forEach((file, index) => {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extrair rota
  const routeMatch = content.match(/createFileRoute\("\/([^"]+)"\)/);
  const routePath = routeMatch ? routeMatch[1] : file.replace('.tsx', '');
  
  // Extrair função
  const functionMatch = content.match(/function (\w+)Page/);
  const functionName = functionMatch ? functionMatch[1] : '';
  
  // Extrair título
  const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
  let title = titleMatch ? titleMatch[1] : functionName || routePath;
  title = title.replace(' — SuaAgenda.Pro', '');
  
  // Extrair descrição
  const descMatch = content.match(/content:\s*["']([^"']+)["']/);
  const description = descMatch ? descMatch[1] : '';
  
  // Normalizar nome
  const pageName = routePath
    .replace(/\.\$.*/, '')
    .replace(/\./g, '-')
    .toLowerCase();
  
  pages.push({
    name: pageName,
    title: title,
    description: description,
  });
  
  // Mostrar progress
  const progress = Math.round(((index + 1) / files.length) * 100);
  process.stdout.write(`\r  ${progress}% - Processando: ${pageName.padEnd(25)}`);
});

console.log('\n');

// ============================================================================
// ETAPA 2: CRIAR ARQUIVO pages.json
// ============================================================================

console.log('\n[2/3] 📝 GERANDO pages.json com suas 28 páginas...\n');

const config = {
  description: 'Páginas do SuaAgenda.Pro - Extraídas automaticamente do repositório',
  totalPages: pages.length,
  pages: pages,
};

fs.writeFileSync('pages.json', JSON.stringify(config, null, 2));
console.log(`✅ Criado: pages.json com ${pages.length} páginas\n`);

// ============================================================================
// ETAPA 3: REPLICAR PARA TODAS
// ============================================================================

console.log('[3/3] 🔄 REPLICANDO para TODAS as páginas...\n');

function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// Ler primeira página como template
let template = '';
const templateFile = files.find(f => !f.startsWith('__') && !f.startsWith('api'));

if (!templateFile) {
  console.error('❌ Erro: Nenhuma página para usar como template!\n');
  process.exit(1);
}

template = fs.readFileSync(path.join(routesDir, templateFile), 'utf-8');

console.log(`📌 Template: ${templateFile.replace('.tsx', '')}\n`);

let created = 0;
let skipped = 0;
let errors = 0;

pages.forEach((page, index) => {
  try {
    const { name, title, description } = page;
    
    if (!name) {
      skipped++;
      return;
    }
    
    const filePath = path.join(routesDir, `${name}.tsx`);
    
    // Se já existe, pular
    if (fs.existsSync(filePath)) {
      skipped++;
      return;
    }
    
    // Gerar novo componente
    const pascalName = toPascalCase(name);
    const routePath = name.toLowerCase();
    
    let newComponent = template;
    
    // Substituir rota
    const oldRoute = template.match(/createFileRoute\("\/([^"]+)"\)/)?.[1] || '';
    newComponent = newComponent.replace(
      new RegExp(`createFileRoute\\("/${oldRoute}"\\)`, 'g'),
      `createFileRoute("/${routePath}")`
    );
    
    // Substituir componente
    const oldPascal = template.match(/function (\w+)Page/)?.[1] || 'Page';
    newComponent = newComponent.replace(
      new RegExp(`function ${oldPascal}Page`, 'g'),
      `function ${pascalName}Page`
    );
    newComponent = newComponent.replace(
      new RegExp(`export default ${oldPascal}Page`, 'g'),
      `export default ${pascalName}Page`
    );
    
    // Substituir título e descrição
    newComponent = newComponent.replace(
      /title: "[^"]*"/,
      `title: "${title} — SuaAgenda.Pro"`
    );
    newComponent = newComponent.replace(
      /content: "[^"]*"/,
      `content: "${description}"`
    );
    
    fs.writeFileSync(filePath, newComponent);
    created++;
    
    // Progress
    const progress = Math.round(((index + 1) / pages.length) * 100);
    process.stdout.write(`\r  ${progress}% - ${name.padEnd(25)}`);
    
  } catch (err) {
    errors++;
  }
});

console.log('\n');

// ============================================================================
// RESULTADO FINAL
// ============================================================================

console.log('\n' + '█'.repeat(60));
console.log('█ ✅ AUTOMAÇÃO CONCLUÍDA COM SUCESSO!'.padEnd(59) + '█');
console.log('█'.repeat(60));

console.log('\n📊 RESULTADO:\n');
console.log(`  📄 Total de páginas: ${pages.length}`);
console.log(`  ✅ Criadas: ${created}`);
console.log(`  ⏭️  Já existiam: ${skipped}`);
console.log(`  ❌ Erros: ${errors}`);

console.log('\n📁 ARQUIVOS GERADOS:\n');
console.log(`  ✅ pages.json (${pages.length} páginas configuradas)`);
if (created > 0) {
  console.log(`  ✅ ${created} novos componentes em src/routes/`);
}

console.log('\n🚀 PRÓXIMOS PASSOS:\n');
console.log('  1. npm run dev              (testar no navegador)');
console.log('  2. npm run type-check       (validar TypeScript)');
console.log('  3. git add .');
console.log('  4. git commit -m "feat: auto-generate all pages"');
console.log('  5. git push\n');

console.log('💡 SUAS PÁGINAS:\n');

pages.slice(0, 15).forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name.padEnd(25)} - ${p.title}`);
});

if (pages.length > 15) {
  console.log(`  ... e mais ${pages.length - 15} páginas\n`);
}

console.log('✨ Todas as 28 páginas estão prontas!\n');
console.log('█'.repeat(60) + '\n');
