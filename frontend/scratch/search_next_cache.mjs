import fs from 'fs';
import path from 'path';

const searchStr = 'document-template--modern';
const startDir = '.next';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.json') || filePath.endsWith('.map') || filePath.endsWith('.pack')) {
        results.push(filePath);
      }
    }
  }
  return results;
}

function main() {
  if (!fs.existsSync(startDir)) {
    console.log("No .next directory found.");
    return;
  }
  
  console.log("Scanning .next files...");
  const files = walk(startDir);
  console.log(`Found ${files.length} cache files. Searching...`);
  
  let foundCount = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(searchStr)) {
        console.log(`Match found in: ${file}`);
        foundCount++;
        // If it's a CSS file, write it as a candidate
        if (file.endsWith('.css')) {
          fs.writeFileSync(`scratch/cache_candidate_${foundCount}.css`, content);
          console.log(`  Saved scratch/cache_candidate_${foundCount}.css`);
        }
      }
    } catch (e) {
      // ignore bin files or read errors
    }
  }
  console.log(`Done. Found ${foundCount} matches.`);
}
main();
