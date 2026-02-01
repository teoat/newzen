import os
import re

def fix_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()

                # Find all imports starting with @/
                # pattern looks for: import ... from '@/' or import('@/')
                def replace_match(match):
                    import_path = match.group(2)
                    # Calculate relative path
                    # Current file depth relative to src
                    rel_to_src = os.path.relpath(directory, root)
                    if rel_to_src == '.':
                        new_path = './' + import_path
                    else:
                        new_path = os.path.join(rel_to_src, import_path)
                    
                    # Ensure it uses forward slashes
                    new_path = new_path.replace(os.sep, '/')
                    if not new_path.startswith('.'):
                        new_path = './' + new_path
                        
                    return f'{match.group(1)}{new_path}{match.group(3)}'

                # Regex to match imports and dynamic imports
                new_content = re.sub(r'(from\s+[\'"])(@/)([^\'"]+[\'"])', replace_match, content)
                new_content = re.sub(r'(import\([\'"])(@/)([^\'"]+[\'"]\))', replace_match, new_content)

                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Fixed imports in: {filepath}")

if __name__ == "__main__":
    src_dir = os.path.abspath("frontend/src")
    fix_imports(src_dir)
