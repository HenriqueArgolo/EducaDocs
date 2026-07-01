import json
from pathlib import Path

def merge_prompts():
    prompts_dir = Path("src/main/resources/prompts")
    catalog = {}
    
    # Read all txt files in the prompts directory
    for file_path in prompts_dir.glob("*.txt"):
        key = file_path.stem
        content = file_path.read_text(encoding="utf-8")
        catalog[key] = content
        print(f"Loaded: {key} ({len(content)} chars)")
        
    # Write to prompts_catalog.json
    output_path = prompts_dir / "prompts_catalog.json"
    output_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSuccessfully generated: {output_path}")

if __name__ == "__main__":
    merge_prompts()
