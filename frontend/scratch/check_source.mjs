import fs from 'fs';

function main() {
  const css = fs.readFileSync('src/app/globals.css', 'utf8');
  console.log("Source CSS length:", css.length);
  console.log("Contains .document-template?", css.includes('.document-template'));
  console.log("Contains document-template--modern?", css.includes('document-template--modern'));
  
  // Print lines 300 to 320
  const lines = css.split('\n');
  console.log("\nLines 300 to 320:");
  for (let i = 299; i < 320; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
main();
