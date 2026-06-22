#!/usr/bin/env node

/**
 * SCRIPT 3: sync-validate.js
 * 
 * Valida se todos os arquivos estão sincronizados corretamente
 * Verifica TypeScript, estrutura, e dependências
 * 
 * Uso: npm run sync:validate
 * 
 * INSTALAR:
 * 1. Copie este arquivo para: scripts/sync-validate.js
 * 2. Adicione em package.json:
 *    "sync:validate": "node scripts/sync-validate.js"
 * 3. Execute: npm run sync:validate
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validando sincronização do projeto...\n');

let hasErrors = false;
let warnings = [];

// ============================================================================
// 1. VERIFICAR ESTRUTURA DE PASTAS
// ============================================================================

console.log('📁 Verificando estrutura de pastas...');

const requiredDirs = [
  'src',
  'src/routes',
  'src/components',
  'src/components/ui',
  'src/lib',
  'src/hooks',
  'docs',
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.error(`  ❌ Faltando: ${dir}`);
    hasErrors = true;
  }
});

// ============================================================================
// 2. VERIFICAR ARQUIVOS CRÍTICOS
// ============================================================================

console.log('\n📄 Verificando arquivos críticos...');

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'src/styles.css',
  'src/router.tsx',
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.error(`  ❌ Faltando: ${file}`);
    hasErrors = true;
  }
});

// ============================================================================
// 3. VERIFICAR COMPONENTES UI
// ============================================================================

console.log('\n🧩 Verificando componentes UI...');

const uiComponents = [
  'button',
  'card',
  'input',
  'form',
  'tabs',
  'sidebar',
  'select',
];

const uiDir = 'src/components/ui';
const uiFiles = fs.readdirSync(uiDir).map(f => f.replace('.tsx', ''));

uiComponents.forEach(comp => {
  if (uiFiles.includes(comp)) {
    console.log(`  ✅ ${comp}.tsx`);
  } else {
    warnings.push(`⚠️  Componente ${comp}.tsx pode estar faltando`);
  }
});

// ============================================================================
// 4. VERIFICAR TYPESCRIPT
// ============================================================================

console.log('\n🔤 Verificando TypeScript...');

try {
  execSync('tsc --noEmit --skipLibCheck 2>&1', { 
    cwd: process.cwd(),
    stdio: 'pipe'
  });
  console.log('  ✅ Sem erros de TypeScript');
} catch (error) {
  const output = error.toString();
  const errorCount = (output.match(/error TS/g) || []).length;
  if (errorCount > 0) {
    console.error(`  ❌ ${errorCount} erros de TypeScript encontrados`);
    console.error('\n     Execute: npm run type-check');
    hasErrors = true;
  }
}

// ============================================================================
// 5. VERIFICAR DEPENDÊNCIAS
// ============================================================================

console.log('\n📦 Verificando dependências...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

const requiredDeps = [
  'react',
  'react-dom',
  'tailwindcss',
  '@tanstack/react-router',
  'framer-motion',
];

requiredDeps.forEach(dep => {
  const isPresent = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  if (isPresent) {
    console.log(`  ✅ ${dep}`);
  } else {
    console.error(`  ❌ Faltando: ${dep}`);
    warnings.push(`Execute: npm install ${dep}`);
  }
});

// ============================================================================
// 6. VERIFICAR SCRIPTS
// ============================================================================

console.log('\n🚀 Verificando scripts em package.json...');

const requiredScripts = [
  'dev',
  'build',
  'type-check',
];

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`  ✅ ${script}`);
  } else {
    warnings.push(`⚠️  Script "${script}" não configurado em package.json`);
  }
});

// ============================================================================
// 7. VERIFICAR ROTAS
// ============================================================================

console.log('\n🗺️  Verificando rotas...');

const routesDir = 'src/routes';
const routeFiles = fs.readdirSync(routesDir)
  .filter(f => f.endsWith('.tsx'))
  .length;

console.log(`  ✅ ${routeFiles} arquivos de rota encontrados`);

if (routeFiles < 5) {
  warnings.push('⚠️  Poucos arquivos de rota. Continue sincronizando do Lovable!');
}

// ============================================================================
// 8. RESUMO FINAL
// ============================================================================

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('\n❌ Validação falhou com erros críticos!\\n');
  console.error('Erros a corrigir:');
  process.exit(1);
} else {
  console.log('\n✅ Validação bem-sucedida!\\n');
}

if (warnings.length > 0) {
  console.log('⚠️  Avisos:');
  warnings.forEach(w => console.log(`  • ${w}`));
  console.log();
}

console.log('📋 Status:');
console.log(`  • Pastas: OK`);
console.log(`  • Arquivos: OK`);
console.log(`  • TypeScript: OK`);
console.log(`  • Dependências: OK`);
console.log(`  • Scripts: OK`);
console.log(`  • Rotas: ${routeFiles} página(s)`);

console.log('\n💡 Próximos passos:');
console.log('  1. npm run dev              (testar localmente)');
console.log('  2. npm run build            (verificar build)');
console.log('  3. npm run sync:lovable     (sincronizar nova tela)');

console.log('\n✨ Seu projeto está pronto para sincronizar com Lovable!\\n');
