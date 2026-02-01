import os
import re

def fix_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.css')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()

                def replace_match(match):
                    # match.group(1) is 'from "' or 'import "' or 'import("'
                    # match.group(2) is '@/'
                    # match.group(3) is 'styles/forensic-theme.css"'
                    
                    full_path = match.group(2) + match.group(3)
                    clean_path = full_path
                    if '@/' in clean_path:
                        clean_path = clean_path.split('@/')[1]
                    
                    rel_to_src = os.path.relpath(directory, root)
                    
                    if rel_to_src == '.':
                        new_path = './' + clean_path
                    else:
                        new_path = os.path.join(rel_to_src, clean_path)
                    
                    new_path = new_path.replace(os.sep, '/')
                    if not new_path.startswith('.'):
                        new_path = './' + new_path
                        
                    return f'{match.group(1)}{new_path}'

                # Regex to match:
                # 1. from "@/"
                # 2. import "@/"
                # 3. import("@/")
                new_content = re.sub(r'(from\s+[\'"])([^"\'@]*@/)([^"\'\n]+)', replace_match, content)
                new_content = re.sub(r'(import\s+[\'"])([^"\'@]*@/)([^"\'\n]+)', replace_match, new_content)
                new_content = re.sub(r'(import\([\'"])([^"\'@]*@/)([^"\'\n]+)', replace_match, new_content)

                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Fixed imports in: {filepath}")

if __name__ == "__main__":
    src_dir = os.path.abspath("frontend/src")
    fix_imports(src_dir)
