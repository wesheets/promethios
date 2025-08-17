# Missing Menu Items from Removed Top Navigation

## Analysis Summary
The top navigation bar was removed in commit `0d8e60c9`. The main parent items "Profile" and "Logout" were added to the bottom of the left navigation, but the sub-menu items under "Settings" and "Help" were missed.

## Items Already Moved ✓
- Profile (added to left nav)
- Logout (added to left nav)

## Missing Sub-Menu Items That Need to be Added

### Settings Sub-Items (5 items missing):
1. **Preferences** - Navigate to `/ui/settings/preferences`
2. **Organization** - Navigate to `/ui/settings/organization`  
3. **Integrations** - Navigate to `/ui/settings/integrations`
4. **Data Management** - Navigate to `/ui/settings/data`
5. **API Keys** - Navigate to `/ui/settings/api-keys`

### Help Sub-Items (3 items missing):
1. **Guided Tours** - Navigate to `/ui/help/tours`
2. **Documentation** - Navigate to `/ui/help/documentation`
3. **Support** - Navigate to `/ui/help/support`

## Icons Used in Original Implementation
- Preferences: `PreferencesIcon` (Tune)
- Organization: `OrganizationIcon` (Business)
- Integrations: `IntegrationsIcon` (Extension)
- Data Management: `DataIcon` (Storage)
- API Keys: `ApiKeyIcon` (Key)
- Guided Tours: `ToursIcon` (Tour)
- Documentation: `DocsIcon` (Description)
- Support: `SupportIcon` (Support)

## Implementation Plan
Add these 8 missing sub-menu items to the bottom of the left navigation in the CollapsibleNavigationEnhanced component, maintaining the same navigation paths and functionality as the original top navigation.

