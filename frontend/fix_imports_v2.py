import os
import re

def fix_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()

                def replace_match(match):
                    # match.group(1) is 'from "' or 'import("'
                    # match.group(2) is '@/' or some mess like '../../../@/'
                    # match.group(3) is 'store/useProject"'
                    
                    full_path = match.group(2) + match.group(3)
                    # Clean the path to get just the part after src/
                    clean_path = full_path
                    if '@/' in clean_path:
                        clean_path = clean_path.split('@/')[1]
                    
                    # Calculate relative path from current file (root) to src (directory)
                    rel_to_src = os.path.relpath(directory, root)
                    
                    if rel_to_src == '.':
                        new_path = './' + clean_path
                    else:
                        new_path = os.path.join(rel_to_src, clean_path)
                    
                    # Ensure it uses forward slashes
                    new_path = new_path.replace(os.sep, '/')
                    if not new_path.startswith('.'):
                        new_path = './' + new_path
                        
                    return f'{match.group(1)}{new_path}'

                # Regex to match imports and dynamic imports
                # Updated to catch the mess I made (../../../@/...)
                new_content = re.sub(r'(from\s+[\'"])([^"\'@]*@/)([^"\'\n]+)', replace_match, content)
                new_content = re.sub(r'(import\([\'"])([^"\'@]*@/)([^"\'\n]+)', replace_match, new_content)

                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Fixed imports in: {filepath}")

if __name__ == "__main__":
    src_dir = os.path.abspath("frontend/src")
    fix_imports(src_dir)
