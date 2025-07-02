import re
import os

# Files to update
files = [
    'src/pages/UserProfileSettingsPage.tsx',
    'src/pages/PreferencesSettingsPage.tsx', 
    'src/pages/OrganizationSettingsPage.tsx'
]

# Pattern to match TextField sx styling
pattern = r'sx=\{\{[^}]*MuiOutlinedInput-root[^}]*\}\}'
replacement = 'sx={darkThemeStyles.textField}'

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Replace TextField styling
        updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        # Add import if not present
        if 'darkThemeStyles' not in updated_content:
            import_line = "import { darkThemeStyles } from '../styles/darkThemeStyles';"
            # Find the last import line
            import_pattern = r'(import[^;]+;)'
            imports = re.findall(import_pattern, updated_content)
            if imports:
                last_import = imports[-1]
                updated_content = updated_content.replace(last_import, last_import + '\n' + import_line)
        
        with open(file_path, 'w') as f:
            f.write(updated_content)
        
        print(f"Updated {file_path}")
    else:
        print(f"File not found: {file_path}")
