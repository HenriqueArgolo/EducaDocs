import json
from pathlib import Path

def fix_formatters():
    catalog_path = Path("src/main/resources/prompts/prompts_catalog.json")
    if not catalog_path.exists():
        print("prompts_catalog.json not found!")
        return
        
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    
    # Update formatters from {0}, {1} etc to %s
    for key, val in catalog.items():
        if "{" in val:
            # We want to replace {0}, {1}, {2}... with %s, but keep double brackets like {{ and }} as { and }
            # Since JSON has already unescaped double braces when reading, we just have single braces left.
            # Let's check if the braces contain digits.
            new_val = val
            # Replace {0}, {1}... {9} with %s
            for i in range(10):
                new_val = new_val.replace(f"{{{i}}}", "%s")
            catalog[key] = new_val
            
    catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Fixed formatters to %s successfully!")

if __name__ == "__main__":
    fix_formatters()
