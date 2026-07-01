async function main() {
  try {
    const res = await fetch('http://localhost:3000/dashboard/document/49');
    const html = await res.text();
    const cssLinks = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m => m[1]);
    const cssUrl = `http://localhost:3000${cssLinks[0]}`;
    const cssRes = await fetch(cssUrl);
    const cssText = await cssRes.text();
    
    const idx = cssText.indexOf('border-beam');
    if (idx !== -1) {
      console.log("CSS after border-beam:");
      console.log("=========================================");
      console.log(cssText.slice(idx, idx + 1500));
      console.log("=========================================");
    }
  } catch (err) {
    console.error(err);
  }
}
main();
