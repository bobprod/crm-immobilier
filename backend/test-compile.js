const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('🔨 Démarrage de la compilation...\n');
  const output = execSync('npx nest build', { 
    encoding: 'utf-8',
    stdio: 'pipe',
    cwd: __dirname
  });
  console.log('✅ COMPILATION RÉUSSIE !\n');
  console.log(output);
} catch (error) {
  console.log('❌ ERREURS DE COMPILATION DÉTECTÉES\n');
  console.log('='.repeat(80));
  console.log(error.stdout || '');
  console.log(error.stderr || '');
  console.log('='.repeat(80));
  
  // Sauvegarder dans un fichier
  const errors = (error.stdout || '') + '\n' + (error.stderr || '');
  fs.writeFileSync('build-errors.txt', errors);
  console.log('\n📝 Erreurs sauvegardées dans build-errors.txt');
  
  process.exit(1);
}
