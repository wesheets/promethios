import re
import os

# Files to update
files = [
    'src/pages/UserProfileSettingsPage.tsx',
    'src/pages/PreferencesSettingsPage.tsx', 
    'src/pages/OrganizationSettingsPage.tsx'
]

def update_component_styling(content):
    # Replace Card styling
    content = re.sub(
        r'<Card sx=\{\{[^}]*backgroundColor[^}]*\}\}',
        '<Card sx={darkThemeStyles.card}',
        content,
        flags=re.DOTALL
    )
    
    # Replace Select styling
    content = re.sub(
        r'<Select[^>]*sx=\{\{[^}]*MuiOutlinedInput[^}]*\}\}',
        lambda m: m.group(0).replace(re.search(r'sx=\{\{[^}]*\}\}', m.group(0)).group(0), 'sx={darkThemeStyles.select}'),
        content,
        flags=re.DOTALL
    )
    
    # Replace FormControl styling
    content = re.sub(
        r'<FormControl[^>]*sx=\{\{[^}]*\}\}',
        lambda m: m.group(0).replace(re.search(r'sx=\{\{[^}]*\}\}', m.group(0)).group(0), 'sx={darkThemeStyles.formControl}'),
        content,
        flags=re.DOTALL
    )
    
    # Replace Tabs styling
    content = re.sub(
        r'<Tabs[^>]*sx=\{\{[^}]*\}\}',
        lambda m: m.group(0).replace(re.search(r'sx=\{\{[^}]*\}\}', m.group(0)).group(0), 'sx={darkThemeStyles.tabs}'),
        content,
        flags=re.DOTALL
    )
    
    # Replace Typography color styling
    content = re.sub(
        r'<Typography[^>]*sx=\{\{[^}]*color[^}]*\}\}',
        lambda m: m.group(0).replace(re.search(r'sx=\{\{[^}]*\}\}', m.group(0)).group(0), 'sx={darkThemeStyles.typography.primary}'),
        content,
        flags=re.DOTALL
    )
    
    return content

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Update component styling
        updated_content = update_component_styling(content)
        
        with open(file_path, 'w') as f:
            f.write(updated_content)
        
        print(f"Updated component styling in {file_path}")
    else:
        print(f"File not found: {file_path}")
