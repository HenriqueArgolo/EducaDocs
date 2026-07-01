import fs from 'fs';

function main() {
  const css = fs.readFileSync('scratch/compiled.css', 'utf8');
  console.log("Total CSS length:", css.length);
  const idx = css.indexOf('border-beam');
  if (idx !== -1) {
    console.log("Index of border-beam:", idx);
    console.log("CSS after border-beam:");
    console.log("=========================================");
    console.log(css.slice(idx, idx + 1000));
    console.log("=========================================");
  } else {
    console.log("border-beam not found!");
  }
}
main();
