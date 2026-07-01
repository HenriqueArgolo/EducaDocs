import fs from 'fs';

function main() {
  const css = fs.readFileSync('scratch/recovered_templates_only.css', 'utf8');
  
  // Format CSS basics
  let formatted = css
    .replace(/\{/g, ' {\n  ')
    .replace(/\}/g, '\n}\n\n')
    .replace(/;/g, ';\n  ')
    .replace(/,\./g, ',\n\.')
    .replace(/  \n/g, '')
    .replace(/\n\s*\n/g, '\n');
    
  // Simple cleanup of extra spaces or clean rules
  formatted = formatted.trim() + '\n';
  
  fs.writeFileSync('scratch/recovered_formatted.css', formatted);
  console.log("Saved scratch/recovered_formatted.css");
}
main();
