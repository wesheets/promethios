# Export/Import Capabilities for Configurations and Reports

## 1. Overview

This document outlines the design for Export/Import capabilities in the Promethios platform. These features will enable users to export configurations and reports for backup, sharing, or migration purposes, and import them back into the system. This functionality is critical for enterprise compliance reporting, configuration management, and cross-environment deployment.

## 2. Core Objectives

- **Data Portability**: Enable users to move configurations and reports between environments
- **Compliance Reporting**: Support exporting governance reports in standard formats for compliance purposes
- **Configuration Management**: Allow backup and restoration of system configurations
- **Collaboration**: Enable sharing of configurations and reports with team members or external stakeholders
- **Versioning**: Support configuration versioning and change tracking

## 3. Architecture

### 3.1 Core Components

1. **ExportService**: The main service responsible for exporting data from the system.
2. **ImportService**: The main service responsible for importing data into the system.
3. **DataTransformerRegistry**: Manages data transformers for different export/import formats.
4. **ValidationService**: Validates imported data before applying it to the system.
5. **ExportFormatRegistry**: Manages available export formats (JSON, CSV, PDF, etc.).

```typescript
// Core service interfaces

interface ExportService {
  initialize(): Promise<void>;
  
  // Export data by type and ID
  exportData(
    type: ExportDataType, 
    id: string, 
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<ExportResult>;
  
  // Export multiple items
  exportMultiple(
    type: ExportDataType, 
    ids: string[], 
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<ExportResult>;
  
  // Export all items of a type
  exportAll(
    type: ExportDataType, 
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<ExportResult>;
  
  // Get available export formats for a data type
  getAvailableFormats(type: ExportDataType): ExportFormat[];
}

interface ImportService {
  initialize(): Promise<void>;
  
  // Validate import data without applying changes
  validateImport(
    data: any, 
    type: ImportDataType, 
    options?: ImportOptions
  ): Promise<ValidationResult>;
  
  // Import data
  importData(
    data: any, 
    type: ImportDataType, 
    options?: ImportOptions
  ): Promise<ImportResult>;
  
  // Get supported import formats
  getSupportedFormats(): ImportFormat[];
}

type ExportDataType = 
  'governance_policy' | 
  'governance_report' | 
  'trust_boundary' | 
  'agent_configuration' | 
  'user_preferences' | 
  'integration_configuration' | 
  'benchmark_results' | 
  'emotional_veritas_configuration';

type ImportDataType = ExportDataType;

interface ExportFormat {
  id: string; // e.g., 'json', 'csv', 'pdf'
  name: string;
  mimeType: string;
  extension: string;
  supportsMultiple: boolean;
}

interface ImportFormat {
  id: string;
  name: string;
  mimeTypes: string[];
  extensions: string[];
}

interface ExportOptions {
  includeMetadata?: boolean;
  includeRelatedData?: boolean;
  anonymize?: boolean;
  password?: string; // For encrypted exports
  compressionLevel?: number;
  customFields?: string[];
  excludeFields?: string[];
}

interface ImportOptions {
  overwrite?: boolean;
  dryRun?: boolean;
  skipValidation?: boolean;
  password?: string; // For encrypted imports
  conflictResolution?: 'skip' | 'overwrite' | 'rename' | 'prompt';
}

interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename?: string;
  format: ExportFormat;
  error?: string;
  metadata?: {
    exportedAt: Date;
    exportedBy: string;
    itemCount: number;
    dataType: ExportDataType;
  };
}

interface ImportResult {
  success: boolean;
  importedItems: {
    id: string;
    type: ImportDataType;
    status: 'created' | 'updated' | 'skipped' | 'failed';
    error?: string;
  }[];
  totalCount: number;
  successCount: number;
  failureCount: number;
  warnings: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: {
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }[];
  warnings: {
    path: string;
    message: string;
  }[];
}
```

### 3.2 Data Flow

- **Export Flow**: User Request -> ExportService -> DataTransformer -> File Download
- **Import Flow**: File Upload -> ImportService -> ValidationService -> DataTransformer -> System Update

## 4. Exportable/Importable Data Types

### 4.1 Governance Policies

- **Export Formats**: JSON, YAML, PDF
- **Use Cases**: Backup, sharing with auditors, migration between environments
- **Special Considerations**: May contain sensitive rules that need to be anonymized

### 4.2 Governance Reports

- **Export Formats**: PDF, CSV, JSON, HTML
- **Use Cases**: Compliance documentation, executive reporting, audit evidence
- **Special Considerations**: May need to include supporting evidence and attestations

### 4.3 Trust Boundaries

- **Export Formats**: JSON, YAML
- **Use Cases**: Configuration backup, sharing with security teams
- **Special Considerations**: May contain sensitive security thresholds

### 4.4 Agent Configurations

- **Export Formats**: JSON, YAML
- **Use Cases**: Agent backup, migration between environments, sharing configurations
- **Special Considerations**: May contain API keys or other secrets that need special handling

### 4.5 User Preferences

- **Export Formats**: JSON
- **Use Cases**: User settings backup, default template creation
- **Special Considerations**: Should exclude personal information when shared

### 4.6 Integration Configurations

- **Export Formats**: JSON, YAML
- **Use Cases**: Integration backup, migration between environments
- **Special Considerations**: Contains credentials that need to be securely handled

### 4.7 Benchmark Results

- **Export Formats**: CSV, JSON, PDF
- **Use Cases**: Performance analysis, compliance reporting, agent comparison
- **Special Considerations**: May contain large datasets that need efficient handling

### 4.8 Emotional Veritas Configurations

- **Export Formats**: JSON, YAML
- **Use Cases**: Configuration backup, sharing with other teams
- **Special Considerations**: Contains emotional impact thresholds that may be organization-specific

## 5. UI Components

### 5.1 Export Dialog Component

A reusable dialog for exporting data:

```typescript
interface ExportDialogProps {
  dataType: ExportDataType;
  ids?: string[];
  title?: string;
  onClose: () => void;
  onExportComplete?: (result: ExportResult) => void;
}

class ExportDialog extends React.Component<ExportDialogProps, ExportDialogState> {
  private exportService: ExportService;
  
  constructor(props: ExportDialogProps) {
    super(props);
    this.exportService = new ExportService();
    this.state = {
      selectedFormat: null,
      availableFormats: [],
      options: {
        includeMetadata: true,
        includeRelatedData: false,
        anonymize: false,
        compressionLevel: 0
      },
      loading: true,
      exporting: false,
      error: null
    };
  }
  
  async componentDidMount() {
    await this.exportService.initialize();
    const availableFormats = this.exportService.getAvailableFormats(this.props.dataType);
    this.setState({
      availableFormats,
      selectedFormat: availableFormats.length > 0 ? availableFormats[0] : null,
      loading: false
    });
  }
  
  handleFormatChange = (formatId: string) => {
    const selectedFormat = this.state.availableFormats.find(f => f.id === formatId);
    this.setState({ selectedFormat });
  };
  
  handleOptionChange = (option: keyof ExportOptions, value: any) => {
    this.setState(prevState => ({
      options: {
        ...prevState.options,
        [option]: value
      }
    }));
  };
  
  handleExport = async () => {
    const { dataType, ids } = this.props;
    const { selectedFormat, options } = this.state;
    
    if (!selectedFormat) return;
    
    this.setState({ exporting: true, error: null });
    
    try {
      let result: ExportResult;
      
      if (!ids || ids.length === 0) {
        // Export all
        result = await this.exportService.exportAll(dataType, selectedFormat, options);
      } else if (ids.length === 1) {
        // Export single item
        result = await this.exportService.exportData(dataType, ids[0], selectedFormat, options);
      } else {
        // Export multiple items
        result = await this.exportService.exportMultiple(dataType, ids, selectedFormat, options);
      }
      
      if (result.success && result.data) {
        this.downloadFile(result.data, result.filename || this.generateFilename(dataType, selectedFormat));
        
        if (this.props.onExportComplete) {
          this.props.onExportComplete(result);
        }
      } else {
        this.setState({ error: result.error || 'Export failed' });
      }
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.setState({ exporting: false });
    }
  };
  
  downloadFile(data: Blob | string, filename: string) {
    const blob = typeof data === 'string' ? new Blob([data]) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  generateFilename(dataType: ExportDataType, format: ExportFormat): string {
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    return `promethios_${dataType}_${date}.${format.extension}`;
  }
  
  render() {
    const { title, dataType, ids } = this.props;
    const { selectedFormat, availableFormats, options, loading, exporting, error } = this.state;
    
    const dialogTitle = title || `Export ${this.formatDataType(dataType)}`;
    const isMultiple = ids && ids.length > 1;
    const isAll = !ids || ids.length === 0;
    
    return (
      <div className="export-dialog">
        <div className="export-dialog-header">
          <h2>{dialogTitle}</h2>
          <button className="close-button" onClick={this.props.onClose}>×</button>
        </div>
        
        <div className="export-dialog-content">
          {loading ? (
            <div className="loading">Loading export options...</div>
          ) : (
            <>
              <div className="export-summary">
                {isAll ? (
                  <p>Exporting all {this.formatDataType(dataType)}</p>
                ) : isMultiple ? (
                  <p>Exporting {ids.length} selected {this.formatDataType(dataType)}</p>
                ) : (
                  <p>Exporting 1 {this.formatDataType(dataType, false)}</p>
                )}
              </div>
              
              <div className="export-format">
                <label htmlFor="format-select">Export Format</label>
                <select 
                  id="format-select" 
                  value={selectedFormat?.id || ''} 
                  onChange={e => this.handleFormatChange(e.target.value)}
                  disabled={exporting}
                >
                  {availableFormats.map(format => (
                    <option key={format.id} value={format.id}>
                      {format.name} (.{format.extension})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="export-options">
                <h3>Options</h3>
                
                <div className="option">
                  <input 
                    type="checkbox" 
                    id="include-metadata" 
                    checked={options.includeMetadata} 
                    onChange={e => this.handleOptionChange('includeMetadata', e.target.checked)}
                    disabled={exporting}
                  />
                  <label htmlFor="include-metadata">Include metadata</label>
                </div>
                
                <div className="option">
                  <input 
                    type="checkbox" 
                    id="include-related" 
                    checked={options.includeRelatedData} 
                    onChange={e => this.handleOptionChange('includeRelatedData', e.target.checked)}
                    disabled={exporting}
                  />
                  <label htmlFor="include-related">Include related data</label>
                </div>
                
                <div className="option">
                  <input 
                    type="checkbox" 
                    id="anonymize" 
                    checked={options.anonymize} 
                    onChange={e => this.handleOptionChange('anonymize', e.target.checked)}
                    disabled={exporting}
                  />
                  <label htmlFor="anonymize">Anonymize sensitive data</label>
                </div>
                
                <div className="option">
                  <label htmlFor="compression">Compression Level</label>
                  <select 
                    id="compression" 
                    value={options.compressionLevel} 
                    onChange={e => this.handleOptionChange('compressionLevel', parseInt(e.target.value))}
                    disabled={exporting}
                  >
                    <option value={0}>None</option>
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </div>
              </div>
              
              {error && (
                <div className="error-message">
                  Error: {error}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="export-dialog-footer">
          <button 
            className="cancel-button" 
            onClick={this.props.onClose}
            disabled={exporting}
          >
            Cancel
          </button>
          <button 
            className="export-button" 
            onClick={this.handleExport}
            disabled={loading || exporting || !selectedFormat}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    );
  }
  
  private formatDataType(type: ExportDataType, plural: boolean = true): string {
    const mapping: Record<ExportDataType, [string, string]> = {
      'governance_policy': ['Governance Policy', 'Governance Policies'],
      'governance_report': ['Governance Report', 'Governance Reports'],
      'trust_boundary': ['Trust Boundary', 'Trust Boundaries'],
      'agent_configuration': ['Agent Configuration', 'Agent Configurations'],
      'user_preferences': ['User Preference', 'User Preferences'],
      'integration_configuration': ['Integration Configuration', 'Integration Configurations'],
      'benchmark_results': ['Benchmark Result', 'Benchmark Results'],
      'emotional_veritas_configuration': ['Emotional Veritas Configuration', 'Emotional Veritas Configurations']
    };
    
    return mapping[type] ? mapping[type][plural ? 1 : 0] : type;
  }
}
```

### 5.2 Import Dialog Component

A reusable dialog for importing data:

```typescript
interface ImportDialogProps {
  dataType: ImportDataType;
  title?: string;
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
}

class ImportDialog extends React.Component<ImportDialogProps, ImportDialogState> {
  private importService: ImportService;
  private fileInputRef: React.RefObject<HTMLInputElement>;
  
  constructor(props: ImportDialogProps) {
    super(props);
    this.importService = new ImportService();
    this.fileInputRef = React.createRef();
    this.state = {
      selectedFile: null,
      options: {
        overwrite: false,
        dryRun: false,
        skipValidation: false,
        conflictResolution: 'prompt'
      },
      validationResult: null,
      importResult: null,
      loading: true,
      importing: false,
      validating: false,
      error: null
    };
  }
  
  async componentDidMount() {
    await this.importService.initialize();
    this.setState({ loading: false });
  }
  
  handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    this.setState({ 
      selectedFile: file || null,
      validationResult: null,
      importResult: null,
      error: null
    });
    
    if (file) {
      this.validateFile(file);
    }
  };
  
  handleOptionChange = (option: keyof ImportOptions, value: any) => {
    this.setState(prevState => ({
      options: {
        ...prevState.options,
        [option]: value
      }
    }));
  };
  
  validateFile = async (file: File) => {
    this.setState({ validating: true, error: null });
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = e.target?.result;
        
        if (data) {
          try {
            const validationResult = await this.importService.validateImport(
              data,
              this.props.dataType,
              { ...this.state.options, dryRun: true }
            );
            
            this.setState({ validationResult });
          } catch (error) {
            this.setState({ error: error.message });
          } finally {
            this.setState({ validating: false });
          }
        }
      };
      
      reader.onerror = () => {
        this.setState({
          error: 'Error reading file',
          validating: false
        });
      };
      
      reader.readAsText(file);
    } catch (error) {
      this.setState({
        error: error.message,
        validating: false
      });
    }
  };
  
  handleImport = async () => {
    const { dataType } = this.props;
    const { selectedFile, options } = this.state;
    
    if (!selectedFile) return;
    
    this.setState({ importing: true, error: null });
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = e.target?.result;
        
        if (data) {
          try {
            const importResult = await this.importService.importData(
              data,
              dataType,
              options
            );
            
            this.setState({ importResult });
            
            if (this.props.onImportComplete) {
              this.props.onImportComplete(importResult);
            }
          } catch (error) {
            this.setState({ error: error.message });
          } finally {
            this.setState({ importing: false });
          }
        }
      };
      
      reader.onerror = () => {
        this.setState({
          error: 'Error reading file',
          importing: false
        });
      };
      
      reader.readAsText(selectedFile);
    } catch (error) {
      this.setState({
        error: error.message,
        importing: false
      });
    }
  };
  
  render() {
    const { title, dataType } = this.props;
    const { 
      selectedFile, 
      options, 
      validationResult, 
      importResult, 
      loading, 
      importing, 
      validating, 
      error 
    } = this.state;
    
    const dialogTitle = title || `Import ${this.formatDataType(dataType)}`;
    const supportedFormats = this.importService.getSupportedFormats()
      .filter(format => format.id !== 'pdf') // PDF is export-only
      .map(format => `.${format.extensions.join(', .')}`)
      .join(', ');
    
    const isValid = validationResult?.valid;
    const hasWarnings = validationResult?.warnings.length > 0;
    
    return (
      <div className="import-dialog">
        <div className="import-dialog-header">
          <h2>{dialogTitle}</h2>
          <button className="close-button" onClick={this.props.onClose}>×</button>
        </div>
        
        <div className="import-dialog-content">
          {loading ? (
            <div className="loading">Loading import options...</div>
          ) : importResult ? (
            <div className="import-result">
              <h3>Import Complete</h3>
              
              <div className="result-summary">
                <p>
                  Successfully imported {importResult.successCount} of {importResult.totalCount} items.
                  {importResult.failureCount > 0 && ` ${importResult.failureCount} items failed.`}
                </p>
              </div>
              
              {importResult.warnings.length > 0 && (
                <div className="result-warnings">
                  <h4>Warnings</h4>
                  <ul>
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.failureCount > 0 && (
                <div className="result-failures">
                  <h4>Failures</h4>
                  <ul>
                    {importResult.importedItems
                      .filter(item => item.status === 'failed')
                      .map((item, index) => (
                        <li key={index}>
                          {item.id}: {item.error || 'Unknown error'}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="import-file">
                <label htmlFor="file-input">Select File</label>
                <input 
                  type="file" 
                  id="file-input" 
                  ref={this.fileInputRef}
                  onChange={this.handleFileChange}
                  accept={supportedFormats}
                  disabled={importing}
                />
                <p className="file-info">
                  {selectedFile ? (
                    `Selected: ${selectedFile.name} (${this.formatFileSize(selectedFile.size)})`
                  ) : (
                    `Supported formats: ${supportedFormats}`
                  )}
                </p>
              </div>
              
              {validating ? (
                <div className="validating">Validating file...</div>
              ) : validationResult && (
                <div className={`validation-result ${isValid ? 'valid' : 'invalid'}`}>
                  {isValid ? (
                    <p className="valid-message">File is valid for import.</p>
                  ) : (
                    <div className="invalid-message">
                      <p>File has validation errors:</p>
                      <ul>
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>{error.path}: {error.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {hasWarnings && (
                    <div className="validation-warnings">
                      <p>Warnings:</p>
                      <ul>
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning.path}: {warning.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="import-options">
                <h3>Options</h3>
                
                <div className="option">
                  <input 
                    type="checkbox" 
                    id="overwrite" 
                    checked={options.overwrite} 
                    onChange={e => this.handleOptionChange('overwrite', e.target.checked)}
                    disabled={importing}
                  />
                  <label htmlFor="overwrite">Overwrite existing items</label>
                </div>
                
                <div className="option">
                  <input 
                    type="checkbox" 
                    id="dry-run" 
                    checked={options.dryRun} 
                    onChange={e => this.handleOptionChange('dryRun', e.target.checked)}
                    disabled={importing}
                  />
                  <label htmlFor="dry-run">Dry run (validate without importing)</label>
                </div>
                
                <div className="option">
                  <label htmlFor="conflict-resolution">Conflict Resolution</label>
                  <select 
                    id="conflict-resolution" 
                    value={options.conflictResolution} 
                    onChange={e => this.handleOptionChange('conflictResolution', e.target.value)}
                    disabled={importing}
                  >
                    <option value="prompt">Prompt for each conflict</option>
                    <option value="skip">Skip conflicting items</option>
                    <option value="overwrite">Overwrite conflicting items</option>
                    <option value="rename">Rename imported items</option>
                  </select>
                </div>
              </div>
              
              {error && (
                <div className="error-message">
                  Error: {error}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="import-dialog-footer">
          <button 
            className="cancel-button" 
            onClick={this.props.onClose}
            disabled={importing}
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>
          
          {!importResult && (
            <button 
              className="import-button" 
              onClick={this.handleImport}
              disabled={loading || importing || !selectedFile || validating || (validationResult && !isValid)}
            >
              {importing ? 'Importing...' : options.dryRun ? 'Validate' : 'Import'}
            </button>
          )}
        </div>
      </div>
    );
  }
  
  private formatDataType(type: ImportDataType): string {
    const mapping: Record<ImportDataType, string> = {
      'governance_policy': 'Governance Policy',
      'governance_report': 'Governance Report',
      'trust_boundary': 'Trust Boundary',
      'agent_configuration': 'Agent Configuration',
      'user_preferences': 'User Preferences',
      'integration_configuration': 'Integration Configuration',
      'benchmark_results': 'Benchmark Results',
      'emotional_veritas_configuration': 'Emotional Veritas Configuration'
    };
    
    return mapping[type] || type;
  }
  
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
```

### 5.3 Data Management Page

A dedicated page for managing exports and imports:

```typescript
class DataManagementPage extends React.Component<{}, DataManagementPageState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      activeTab: 'export',
      selectedDataType: 'governance_policy',
      showExportDialog: false,
      showImportDialog: false,
      items: [],
      selectedItems: [],
      loading: true,
      error: null
    };
  }
  
  async componentDidMount() {
    await this.loadItems();
  }
  
  loadItems = async () => {
    this.setState({ loading: true, error: null });
    
    try {
      // Load items based on selected data type
      // Implementation details omitted for brevity
      const items = await this.fetchItems(this.state.selectedDataType);
      this.setState({ items, loading: false });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  };
  
  fetchItems = async (dataType: ExportDataType): Promise<any[]> => {
    // Implementation details omitted for brevity
    return [];
  };
  
  handleTabChange = (tab: 'export' | 'import') => {
    this.setState({ activeTab: tab });
  };
  
  handleDataTypeChange = (dataType: ExportDataType) => {
    this.setState({ 
      selectedDataType: dataType,
      selectedItems: []
    }, this.loadItems);
  };
  
  handleItemSelection = (itemId: string, selected: boolean) => {
    this.setState(prevState => {
      if (selected) {
        return {
          selectedItems: [...prevState.selectedItems, itemId]
        };
      } else {
        return {
          selectedItems: prevState.selectedItems.filter(id => id !== itemId)
        };
      }
    });
  };
  
  handleSelectAll = (selected: boolean) => {
    this.setState(prevState => ({
      selectedItems: selected ? prevState.items.map(item => item.id) : []
    }));
  };
  
  openExportDialog = () => {
    this.setState({ showExportDialog: true });
  };
  
  closeExportDialog = () => {
    this.setState({ showExportDialog: false });
  };
  
  openImportDialog = () => {
    this.setState({ showImportDialog: true });
  };
  
  closeImportDialog = () => {
    this.setState({ showImportDialog: false });
  };
  
  handleExportComplete = (result: ExportResult) => {
    // Handle export completion
    // Implementation details omitted for brevity
  };
  
  handleImportComplete = (result: ImportResult) => {
    // Handle import completion
    // Implementation details omitted for brevity
    this.loadItems();
  };
  
  render() {
    const {
      activeTab,
      selectedDataType,
      showExportDialog,
      showImportDialog,
      items,
      selectedItems,
      loading,
      error
    } = this.state;
    
    return (
      <div className="data-management-page">
        <h1>Data Management</h1>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => this.handleTabChange('export')}
          >
            Export
          </button>
          <button 
            className={`tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => this.handleTabChange('import')}
          >
            Import
          </button>
        </div>
        
        <div className="data-type-selector">
          <label htmlFor="data-type">Data Type</label>
          <select 
            id="data-type" 
            value={selectedDataType} 
            onChange={e => this.handleDataTypeChange(e.target.value as ExportDataType)}
          >
            <option value="governance_policy">Governance Policies</option>
            <option value="governance_report">Governance Reports</option>
            <option value="trust_boundary">Trust Boundaries</option>
            <option value="agent_configuration">Agent Configurations</option>
            <option value="user_preferences">User Preferences</option>
            <option value="integration_configuration">Integration Configurations</option>
            <option value="benchmark_results">Benchmark Results</option>
            <option value="emotional_veritas_configuration">Emotional Veritas Configurations</option>
          </select>
        </div>
        
        {activeTab === 'export' ? (
          <div className="export-tab">
            <div className="actions">
              <button 
                className="export-all-button" 
                onClick={this.openExportDialog}
              >
                Export All
              </button>
              <button 
                className="export-selected-button" 
                onClick={this.openExportDialog}
                disabled={selectedItems.length === 0}
              >
                Export Selected ({selectedItems.length})
              </button>
            </div>
            
            <div className="items-list">
              {loading ? (
                <div className="loading">Loading items...</div>
              ) : error ? (
                <div className="error-message">Error: {error}</div>
              ) : items.length === 0 ? (
                <div className="empty-message">No items found.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          checked={selectedItems.length === items.length}
                          onChange={e => this.handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Name</th>
                      <th>Last Modified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedItems.includes(item.id)}
                            onChange={e => this.handleItemSelection(item.id, e.target.checked)}
                          />
                        </td>
                        <td>{item.name}</td>
                        <td>{new Date(item.updatedAt).toLocaleString()}</td>
                        <td>
                          <button 
                            className="export-button" 
                            onClick={() => {
                              this.setState({ selectedItems: [item.id] }, this.openExportDialog);
                            }}
                          >
                            Export
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="import-tab">
            <div className="actions">
              <button 
                className="import-button" 
                onClick={this.openImportDialog}
              >
                Import {this.formatDataType(selectedDataType)}
              </button>
            </div>
            
            <div className="import-history">
              <h3>Recent Imports</h3>
              {/* Import history table omitted for brevity */}
            </div>
          </div>
        )}
        
        {showExportDialog && (
          <ExportDialog 
            dataType={selectedDataType}
            ids={selectedItems.length > 0 ? selectedItems : undefined}
            onClose={this.closeExportDialog}
            onExportComplete={this.handleExportComplete}
          />
        )}
        
        {showImportDialog && (
          <ImportDialog 
            dataType={selectedDataType}
            onClose={this.closeImportDialog}
            onImportComplete={this.handleImportComplete}
          />
        )}
      </div>
    );
  }
  
  private formatDataType(type: ExportDataType): string {
    const mapping: Record<ExportDataType, string> = {
      'governance_policy': 'Governance Policy',
      'governance_report': 'Governance Report',
      'trust_boundary': 'Trust Boundary',
      'agent_configuration': 'Agent Configuration',
      'user_preferences': 'User Preferences',
      'integration_configuration': 'Integration Configuration',
      'benchmark_results': 'Benchmark Results',
      'emotional_veritas_configuration': 'Emotional Veritas Configuration'
    };
    
    return mapping[type] || type;
  }
}
```

### 5.4 Quick Export/Import Buttons

Components for adding export/import functionality to existing pages:

```typescript
interface QuickExportButtonProps {
  dataType: ExportDataType;
  id?: string;
  ids?: string[];
  label?: string;
  className?: string;
}

class QuickExportButton extends React.Component<QuickExportButtonProps, QuickExportButtonState> {
  constructor(props: QuickExportButtonProps) {
    super(props);
    this.state = {
      showDialog: false
    };
  }
  
  openDialog = () => {
    this.setState({ showDialog: true });
  };
  
  closeDialog = () => {
    this.setState({ showDialog: false });
  };
  
  render() {
    const { dataType, id, ids, label, className } = this.props;
    const { showDialog } = this.state;
    
    // Determine which IDs to export
    const exportIds = id ? [id] : ids;
    
    // Default label based on context
    const defaultLabel = id ? 'Export' : ids && ids.length > 0 ? `Export (${ids.length})` : 'Export All';
    
    return (
      <>
        <button 
          className={`quick-export-button ${className || ''}`}
          onClick={this.openDialog}
        >
          {label || defaultLabel}
        </button>
        
        {showDialog && (
          <ExportDialog 
            dataType={dataType}
            ids={exportIds}
            onClose={this.closeDialog}
          />
        )}
      </>
    );
  }
}

interface QuickImportButtonProps {
  dataType: ImportDataType;
  label?: string;
  className?: string;
  onImportComplete?: (result: ImportResult) => void;
}

class QuickImportButton extends React.Component<QuickImportButtonProps, QuickImportButtonState> {
  constructor(props: QuickImportButtonProps) {
    super(props);
    this.state = {
      showDialog: false
    };
  }
  
  openDialog = () => {
    this.setState({ showDialog: true });
  };
  
  closeDialog = () => {
    this.setState({ showDialog: false });
  };
  
  handleImportComplete = (result: ImportResult) => {
    if (this.props.onImportComplete) {
      this.props.onImportComplete(result);
    }
  };
  
  render() {
    const { dataType, label, className } = this.props;
    const { showDialog } = this.state;
    
    return (
      <>
        <button 
          className={`quick-import-button ${className || ''}`}
          onClick={this.openDialog}
        >
          {label || 'Import'}
        </button>
        
        {showDialog && (
          <ImportDialog 
            dataType={dataType}
            onClose={this.closeDialog}
            onImportComplete={this.handleImportComplete}
          />
        )}
      </>
    );
  }
}
```

## 6. Firebase Integration

### 6.1 Export/Import History

Export and import history is stored in Firebase for auditing and tracking:

```typescript
// Firebase integration for export/import history
class FirebaseExportImportHistoryManager {
  private firestore: firebase.firestore.Firestore;
  private auth: firebase.auth.Auth;
  private currentUser: firebase.User | null = null;
  
  constructor(firebaseApp: firebase.app.App) {
    this.firestore = firebaseApp.firestore();
    this.auth = firebaseApp.auth();
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
    });
  }
  
  async logExport(exportResult: ExportResult, dataType: ExportDataType, itemIds?: string[]): Promise<void> {
    if (!this.currentUser) return;
    
    try {
      await this.firestore.collection('exportHistory').add({
        userId: this.currentUser.uid,
        userName: this.currentUser.displayName || this.currentUser.email,
        dataType,
        format: exportResult.format.id,
        itemCount: exportResult.metadata?.itemCount || (itemIds?.length || 0),
        itemIds: itemIds || [],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        success: exportResult.success,
        error: exportResult.error
      });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  }
  
  async logImport(importResult: ImportResult, dataType: ImportDataType): Promise<void> {
    if (!this.currentUser) return;
    
    try {
      await this.firestore.collection('importHistory').add({
        userId: this.currentUser.uid,
        userName: this.currentUser.displayName || this.currentUser.email,
        dataType,
        totalCount: importResult.totalCount,
        successCount: importResult.successCount,
        failureCount: importResult.failureCount,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        success: importResult.successCount > 0,
        warnings: importResult.warnings,
        itemIds: importResult.importedItems
          .filter(item => item.status === 'created' || item.status === 'updated')
          .map(item => item.id)
      });
    } catch (error) {
      console.error('Error logging import:', error);
    }
  }
  
  async getExportHistory(limit: number = 10): Promise<any[]> {
    if (!this.currentUser) return [];
    
    try {
      const snapshot = await this.firestore
        .collection('exportHistory')
        .where('userId', '==', this.currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      const history: any[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });
      
      return history;
    } catch (error) {
      console.error('Error getting export history:', error);
      return [];
    }
  }
  
  async getImportHistory(limit: number = 10): Promise<any[]> {
    if (!this.currentUser) return [];
    
    try {
      const snapshot = await this.firestore
        .collection('importHistory')
        .where('userId', '==', this.currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      const history: any[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });
      
      return history;
    } catch (error) {
      console.error('Error getting import history:', error);
      return [];
    }
  }
}
```

### 6.2 Security Rules

Firestore security rules for export/import functionality:

```firestore.rules
match /exportHistory/{historyId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
  allow update, delete: if false; // Immutable history
}

match /importHistory/{historyId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
  allow update, delete: if false; // Immutable history
}
```

## 7. Navigation Integration

### 7.1 Left Navigation Integration

The Data Management page is accessible from the left navigation:

```typescript
// Left navigation integration
const leftNavItems = [
  // ... other navigation items
  {
    id: 'settings',
    label: 'Settings',
    icon: 'cog',
    children: [
      // ... other settings items
      {
        id: 'data-management',
        label: 'Data Management',
        route: '/settings/data-management',
        icon: 'database'
      }
    ]
  }
];
```

### 7.2 Context Menu Integration

Export/import functionality is available in context menus throughout the application:

```typescript
// Example context menu integration for governance policies
function GovernancePolicyContextMenu({ policy, onClose }) {
  return (
    <div className="context-menu">
      <div className="context-menu-item" onClick={() => { /* View details */ }}>
        View Details
      </div>
      <div className="context-menu-item" onClick={() => { /* Edit policy */ }}>
        Edit Policy
      </div>
      <div className="context-menu-item">
        <QuickExportButton 
          dataType="governance_policy" 
          id={policy.id} 
          label="Export Policy"
        />
      </div>
      <div className="context-menu-item" onClick={onClose}>
        Cancel
      </div>
    </div>
  );
}
```

## 8. Mobile Responsiveness

### 8.1 Export Dialog Responsiveness

The Export Dialog adapts to different screen sizes:

- **Mobile**: Full-screen dialog with simplified options
- **Tablet**: Modal dialog with standard options
- **Desktop**: Standard modal dialog with full options

```css
/* Example responsive styles for export dialog */
.export-dialog {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  
  @media (min-width: 992px) {
    width: 600px;
    max-width: 90%;
    margin: 0 auto;
  }
  
  @media (min-width: 768px) and (max-width: 991px) {
    width: 500px;
    max-width: 90%;
    margin: 0 auto;
  }
  
  @media (max-width: 767px) {
    width: 100%;
    height: 100%;
    border-radius: 0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
```

### 8.2 Import Dialog Responsiveness

The Import Dialog adapts to different screen sizes:

- **Mobile**: Full-screen dialog with simplified options
- **Tablet**: Modal dialog with standard options
- **Desktop**: Standard modal dialog with full options

```css
/* Example responsive styles for import dialog */
.import-dialog {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  
  @media (min-width: 992px) {
    width: 600px;
    max-width: 90%;
    margin: 0 auto;
  }
  
  @media (min-width: 768px) and (max-width: 991px) {
    width: 500px;
    max-width: 90%;
    margin: 0 auto;
  }
  
  @media (max-width: 767px) {
    width: 100%;
    height: 100%;
    border-radius: 0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
```

### 8.3 Data Management Page Responsiveness

The Data Management page adapts to different screen sizes:

- **Mobile**: Single column layout with stacked elements
- **Tablet**: Two column layout with responsive tables
- **Desktop**: Standard layout with full tables

```css
/* Example responsive styles for data management page */
.data-management-page {
  padding: 20px;
  
  @media (max-width: 767px) {
    padding: 10px;
  }
}

.items-list table {
  width: 100%;
  
  @media (max-width: 767px) {
    display: block;
    overflow-x: auto;
  }
}
```

## 9. Accessibility

### 9.1 Keyboard Navigation

All export/import components support keyboard navigation:

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons
- **Escape**: Close dialogs

### 9.2 Screen Reader Support

All components include proper ARIA attributes:

- **aria-label**: Descriptive labels for buttons and controls
- **aria-live**: Announcements for export/import status
- **aria-expanded**: State of expandable elements

### 9.3 Focus Management

Focus is properly managed during export/import operations:

- Focus is trapped within dialogs when open
- Focus returns to the triggering element when dialogs close
- Focus is properly managed during multi-step operations

## 10. Extension Points

```typescript
// Register a custom export format
ExtensionRegistry.registerExtensionPoint("export:format", {
  register: (format: ExportFormat) => ExportFormatRegistry.registerFormat(format),
});

// Register a custom import format
ExtensionRegistry.registerExtensionPoint("import:format", {
  register: (format: ImportFormat) => ImportFormatRegistry.registerFormat(format),
});

// Register a custom data transformer
ExtensionRegistry.registerExtensionPoint("export:transformer", {
  register: (transformer: DataTransformer) => DataTransformerRegistry.registerTransformer(transformer),
});
```

## 11. Implementation Plan

### 11.1 Phase 1: Core Services
1. Implement `ExportService` and `ImportService`
2. Implement data transformers for common formats (JSON, CSV, PDF)
3. Implement validation service for import data

### 11.2 Phase 2: UI Components
1. Implement `ExportDialog` and `ImportDialog` components
2. Implement `DataManagementPage` component
3. Implement quick export/import buttons

### 11.3 Phase 3: Firebase Integration
1. Set up Firestore collections for export/import history
2. Implement history tracking and logging
3. Configure security rules

### 11.4 Phase 4: Navigation Integration
1. Add Data Management page to left navigation
2. Integrate export/import functionality in context menus
3. Add export/import buttons to relevant pages

### 11.5 Phase 5: Testing and Refinement
1. Test export/import functionality with various data types
2. Ensure mobile responsiveness
3. Implement accessibility features
4. Gather feedback and refine

## 12. Next Steps

1. Begin implementation of `ExportService` and `ImportService`
2. Create data transformers for JSON and CSV formats
3. Implement the `ExportDialog` component
4. Set up Firestore collections for export/import history
