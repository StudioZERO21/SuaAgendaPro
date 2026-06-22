#!/usr/bin/env node

/**
 * ADICIONA TODOS OS SCRIPTS AUTOMATICAMENTE
 * 
 * Detecta os scripts que existem em scripts/
 * Adiciona automaticamente em package.json
 * 
 * Uso:
 * node scripts/setup-all-scripts.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔧 CONFIGURADOR DE SCRIPTS\n');
console.log('='.repeat(60));

// ============================================================================
// 1. DETECTAR SCRIPTS EXISTENTES
// ============================================================================

console.log('\n📊 Detectando scripts em scripts/...\n');

const scriptsDir = 'scripts';
const packageJsonPath = 'package.json';

if (!fs.existsSync(scriptsDir)) {
  console.error('❌ Erro: pasta scripts/ não encontrada!\n');
  process.exit(1);
}

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Erro: package.json não encontrado!\n');
  process.exit(1);
}

// Ler scripts existentes
const scriptFiles = fs.readdirSync(scriptsDir)
  .filter(f => f.endsWith('.mjs') || f.endsWith('.js'))
  .sort();

console.log(`✅ Encontrados ${scriptFiles.length} scripts:\n`);

const scriptsToAdd = [];

scriptFiles.forEach(file => {
  const scriptName = file.replace('.mjs', '').replace('.js', '');
  
  // Mapear nomes
  let npmName = scriptName;
  let description = '';
  
  switch(scriptName) {
    case 'maestro-auto-all':
      npmName = 'maestro:all';
      description = 'Automação completa - sincroniza todas as 28 páginas';
      break;
    case 'extract-existing-pages':
      npmName = 'extract:pages';
      description = 'Extrai páginas existentes do repositório';
      break;
    case 'replicate-from-git':
      npmName = 'replicate:pages';
      description = 'Replica páginas baseado em template';
      break;
    case 'convert-lovable':
      npmName = 'convert:lovable';
      description = 'Converte HTML do Lovable para React';
      break;
    case 'sync-lovable':
      npmName = 'sync:lovable';
      description = 'Documenta tela do Lovable';
      break;
    case 'sync-convert':
      npmName = 'sync:convert';
      description = 'Converte tela para React';
      break;
    case 'sync-validate':
      npmName = 'sync:validate';
      description = 'Valida sincronização';
      break;
  }
  
  scriptsToAdd.push({
    name: npmName,
    file: file,
    description: description,
  });
  
  console.log(`  ✅ ${npmName}`);
  if (description) console.log(`     ${description}`);
});

// ============================================================================
// 2. ADICIONAR AO package.json
// ============================================================================

console.log('\n📝 Adicionando scripts ao package.json...\n');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

let added = 0;
let skipped = 0;

scriptsToAdd.forEach(script => {
  const command = `node scripts/${script.file}`;
  
  if (packageJson.scripts[script.name]) {
    console.log(`  ⏭️  ${script.name} (já existe)`);
    skipped++;
  } else {
    packageJson.scripts[script.name] = command;
    console.log(`  ✅ ${script.name}`);
    added++;
  }
});

// Salvar
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// ============================================================================
// 3. RESUMO
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA!\n');

console.log('📊 Resumo:');
console.log(`  ✅ Scripts adicionados: ${added}`);
console.log(`  ⏭️  Já existiam: ${skipped}`);

console.log('\n📋 Scripts disponíveis:\n');

scriptsToAdd.forEach(script => {
  console.log(`  npm run ${script.name}`);
  if (script.description) console.log(`    → ${script.description}`);
});

console.log('\n🚀 Próximo passo:\n');
console.log('  npm run maestro:all\n');

console.log('✨ Tudo pronto!\n');
console.log('='.repeat(60) + '\n');
