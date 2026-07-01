import fs from 'fs';

function main() {
  const path = 'scratch/cache_candidate_8.css';
  if (!fs.existsSync(path)) {
    console.log("Candidate file not found.");
    return;
  }
  
  const css = fs.readFileSync(path, 'utf8');
  console.log("CSS file size:", css.length);
  
  // Search for the index of document-template
  const idx = css.indexOf('.document-template');
  if (idx !== -1) {
    console.log("Found .document-template at index:", idx);
    // Find the end of the template classes before @media print
    const printIdx = css.indexOf('@media print', idx);
    console.log("Found @media print at index:", printIdx);
    
    const templateCss = css.slice(idx, printIdx !== -1 ? printIdx : css.length);
    console.log("Extracted template CSS length:", templateCss.length);
    fs.writeFileSync('scratch/recovered_templates_only.css', templateCss);
    console.log("Saved scratch/recovered_templates_only.css!");
  } else {
    console.log(".document-template not found in the CSS chunk!");
  }
}
main();
