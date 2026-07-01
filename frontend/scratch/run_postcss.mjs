import fs from 'fs';
import postcss from 'postcss';

async function main() {
  try {
    const css = fs.readFileSync('src/app/globals.css', 'utf8');
    const result = await postcss([]).process(css, { from: 'src/app/globals.css' });
    console.log("Plain PostCSS compiled successfully!");
    console.log("Compiled CSS length:", result.css.length);
    console.log("Contains .document-template?", result.css.includes('.document-template'));
    fs.writeFileSync('scratch/compiled.css', result.css);
  } catch (err) {
    console.error("Plain PostCSS compilation failed:", err);
  }
}
main();
