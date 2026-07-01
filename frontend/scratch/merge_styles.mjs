import fs from 'fs';

function main() {
  const sourcePath = 'src/app/globals.css';
  const recoveredPath = 'scratch/recovered_formatted.css';
  
  const sourceCss = fs.readFileSync(sourcePath, 'utf8');
  const recoveredCss = fs.readFileSync(recoveredPath, 'utf8');
  
  // Find where @media print starts
  const printIdx = sourceCss.indexOf('@media print {');
  if (printIdx === -1) {
    console.log("Could not find @media print in globals.css");
    return;
  }
  
  // Split globals.css at @media print
  const beforePrint = sourceCss.slice(0, printIdx);
  const printBlock = sourceCss.slice(printIdx);
  
  // Merge
  const finalCss = beforePrint + '\n' + recoveredCss + '\n' + printBlock;
  fs.writeFileSync(sourcePath, finalCss);
  console.log("globals.css successfully updated with recovered styles!");
}
main();
