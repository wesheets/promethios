#!/usr/bin/env node

/**
 * Phase Change Tracker Tool
 * 
 * This tool analyzes repository changes between phases and generates
 * comprehensive documentation of structural changes, file movements,
 * and API modifications.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import attribution module
const attribution = require('./attribution');

// Import chalk with ESM compatibility fix
let chalk;
try {
  chalk = require('chalk');
  // Handle both ESM and CommonJS versions of chalk
  if (chalk.default && typeof chalk.default === 'function') {
    // ESM style import
    chalk = chalk.default;
  }
} catch (error) {
  // Fallback if chalk isn't available
  chalk = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    magenta: (text) => `\x1b[35m${text}\x1b[0m`
  };
}

// Configuration
const CONFIG = {
  outputDir: 'phase_changes',
  phaseTagPrefix: 'phase-',
  ignoreDirs: ['node_modules', '.git', 'dist', 'build'],
  trackExtensions: ['.js', '.jsx', '.ts', '.tsx', '.md', '.json', '.yml', '.yaml'],
  diffContextLines: 3,
  maxDiffSize: 10000, // characters
};

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log(chalk.yellow('Usage: phase-change-tracker <previous-phase> <current-phase> [options]'));
      console.log('Example: phase-change-tracker 6.5 7.0');
      console.log('\nOptions:');
      console.log('  --output-dir=<dir>    Output directory (default: phase_changes)');
      console.log('  --detailed-diff       Include detailed diffs in the report');
      console.log('  --include-all-files   Include all file types in analysis');
      console.log('  --attribution         Include developer attribution information');
      process.exit(1);
    }
    
    const previousPhase = args[0];
    const currentPhase = args[1];
    
    // Parse options
    const options = parseOptions(args.slice(2));
    
    // Ensure output directory exists
    const outputDir = options.outputDir || CONFIG.outputDir;
    ensureDirectoryExists(outputDir);
    
    console.log(chalk.blue(`\n📊 Phase Change Tracker: Analyzing changes between Phase ${previousPhase} and Phase ${currentPhase}\n`));
    
    // Get git references for the phases
    const prevRef = getPhaseReference(previousPhase);
    const currRef = getPhaseReference(currentPhase);
    
    console.log(chalk.gray(`Previous phase reference: ${prevRef}`));
    console.log(chalk.gray(`Current phase reference: ${currRef}`));
    
    // Analyze directory structure changes
    console.log(chalk.blue('\n📁 Analyzing directory structure changes...'));
    const dirChanges = analyzeDirectoryChanges(prevRef, currRef);
    
    // Analyze file changes
    console.log(chalk.blue('\n📄 Analyzing file changes...'));
    const fileChanges = analyzeFileChanges(prevRef, currRef, options);
    
    // Analyze API changes
    console.log(chalk.blue('\n🔄 Analyzing API changes...'));
    const apiChanges = analyzeApiChanges(prevRef, currRef, fileChanges);
    
    // Get attribution information if requested
    let attributionInfo = null;
    if (options.attribution) {
      console.log(chalk.blue('\n👤 Analyzing developer attribution...'));
      
      const dirAttribution = attribution.getDirectoryAttribution(dirChanges, prevRef, currRef);
      const fileAttribution = attribution.getFileAttribution(fileChanges, prevRef, currRef);
      const apiAttribution = attribution.getApiAttribution(apiChanges, prevRef, currRef);
      
      attributionInfo = {
        directories: dirAttribution,
        files: fileAttribution,
        api: apiAttribution,
        summary: attribution.generateAttributionSummary(dirAttribution, fileAttribution, apiAttribution)
      };
      
      console.log(chalk.green(`Total contributors: ${attributionInfo.summary.totalContributors}`));
    }
    
    // Generate report
    console.log(chalk.blue('\n📝 Generating phase change report...'));
    const report = generateReport(previousPhase, currentPhase, dirChanges, fileChanges, apiChanges, attributionInfo, options);
    
    // Write report to file
    const reportPath = path.join(outputDir, `phase_${previousPhase}_to_${currentPhase}_changes.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(chalk.green(`\n✅ Phase change report generated successfully: ${reportPath}`));
    
    // Generate visualization if requested
    if (options.generateVisualization) {
      console.log(chalk.blue('\n🎨 Generating visualization...'));
      generateVisualization(previousPhase, currentPhase, dirChanges, fileChanges, outputDir);
      console.log(chalk.green(`\n✅ Visualization generated successfully`));
    }
    
    // Generate index if this is a new report
    updateReportIndex(outputDir);
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Parse command line options
 */
function parseOptions(args) {
  const options = {
    outputDir: CONFIG.outputDir,
    detailedDiff: false,
    includeAllFiles: false,
    generateVisualization: true,
    attribution: false,
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg === '--detailed-diff') {
      options.detailedDiff = true;
    } else if (arg === '--include-all-files') {
      options.includeAllFiles = true;
    } else if (arg === '--no-visualization') {
      options.generateVisualization = false;
    } else if (arg === '--attribution') {
      options.attribution = true;
    }
  });
  
  return options;
}

/**
 * Ensure directory exists
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(chalk.gray(`Created directory: ${dir}`));
  }
}

/**
 * Get git reference for a phase
 */
function getPhaseReference(phase) {
  // Try tag first
  try {
    const tagName = `${CONFIG.phaseTagPrefix}${phase}`;
    execSync(`git rev-parse ${tagName}`, { stdio: 'ignore' });
    return tagName;
  } catch (e) {
    // Tag doesn't exist, try branch
    try {
      const branchName = `feature/phase-${phase}`;
      execSync(`git rev-parse ${branchName}`, { stdio: 'ignore' });
      return branchName;
    } catch (e) {
      // Branch doesn't exist, try commit message pattern
      try {
        const commitHash = execSync(
          `git log --grep="Phase ${phase}" --format="%H" -n 1`,
          { encoding: 'utf8' }
        ).trim();
        
        if (commitHash) {
          return commitHash;
        }
      } catch (e) {
        // Ignore
      }
    }
  }
  
  // If we get here, we couldn't find a reference
  throw new Error(`Could not find git reference for Phase ${phase}`);
}

/**
 * Analyze directory structure changes
 */
function analyzeDirectoryChanges(prevRef, currRef) {
  const changes = {
    added: [],
    removed: [],
    modified: [],
  };
  
  // Get directory structure at previous phase
  const prevDirs = getDirectoryStructure(prevRef);
  
  // Get directory structure at current phase
  const currDirs = getDirectoryStructure(currRef);
  
  // Find added directories
  currDirs.forEach(dir => {
    if (!prevDirs.includes(dir)) {
      changes.added.push(dir);
    }
  });
  
  // Find removed directories
  prevDirs.forEach(dir => {
    if (!currDirs.includes(dir)) {
      changes.removed.push(dir);
    }
  });
  
  // Find modified directories (same path but different content)
  const commonDirs = prevDirs.filter(dir => currDirs.includes(dir));
  commonDirs.forEach(dir => {
    const prevFiles = getFilesInDirectory(prevRef, dir);
    const currFiles = getFilesInDirectory(currRef, dir);
    
    if (JSON.stringify(prevFiles.sort()) !== JSON.stringify(currFiles.sort())) {
      changes.modified.push(dir);
    }
  });
  
  console.log(chalk.green(`Added directories: ${changes.added.length}`));
  console.log(chalk.red(`Removed directories: ${changes.removed.length}`));
  console.log(chalk.yellow(`Modified directories: ${changes.modified.length}`));
  
  return changes;
}

/**
 * Get directory structure at a specific git reference
 */
function getDirectoryStructure(ref) {
  try {
    const output = execSync(
      `git ls-tree -r --name-only ${ref} | grep -v "${CONFIG.ignoreDirs.join('\\|')}" | xargs -I{} dirname {} | sort | uniq`,
      { encoding: 'utf8' }
    );
    
    return output.split('\n').filter(Boolean);
  } catch (e) {
    console.error(chalk.red(`Error getting directory structure: ${e.message}`));
    return [];
  }
}

/**
 * Get files in a directory at a specific git reference
 */
function getFilesInDirectory(ref, dir) {
  try {
    const output = execSync(
      `git ls-tree -r --name-only ${ref} -- ${dir} | grep -v "${CONFIG.ignoreDirs.join('\\|')}"`,
      { encoding: 'utf8' }
    );
    
    return output.split('\n').filter(Boolean);
  } catch (e) {
    console.error(chalk.red(`Error getting files in directory: ${e.message}`));
    return [];
  }
}

/**
 * Analyze file changes
 */
function analyzeFileChanges(prevRef, currRef, options) {
  const changes = {
    added: [],
    removed: [],
    modified: [],
    renamed: [],
    moved: [],
  };
  
  try {
    // Get file changes between refs
    const diffOutput = execSync(
      `git diff --name-status ${prevRef} ${currRef}`,
      { encoding: 'utf8' }
    );
    
    const lines = diffOutput.split('\n').filter(Boolean);
    
    lines.forEach(line => {
      const [status, ...paths] = line.split('\t');
      
      // Skip files in ignored directories
      if (CONFIG.ignoreDirs.some(dir => paths[0].includes(`/${dir}/`) || paths[0].startsWith(`${dir}/`))) {
        return;
      }
      
      // Skip files with non-tracked extensions unless includeAllFiles is true
      if (!options.includeAllFiles && 
          !CONFIG.trackExtensions.some(ext => paths[0].endsWith(ext)) &&
          (paths.length < 2 || !CONFIG.trackExtensions.some(ext => paths[1].endsWith(ext)))) {
        return;
      }
      
      if (status === 'A') {
        changes.added.push(paths[0]);
      } else if (status === 'D') {
        changes.removed.push(paths[0]);
      } else if (status === 'M') {
        changes.modified.push(paths[0]);
      } else if (status.startsWith('R')) {
        changes.renamed.push({ from: paths[0], to: paths[1] });
      } else if (status.startsWith('C')) {
        changes.moved.push({ from: paths[0], to: paths[1] });
      }
    });
    
    console.log(chalk.green(`Added files: ${changes.added.length}`));
    console.log(chalk.red(`Removed files: ${changes.removed.length}`));
    console.log(chalk.yellow(`Modified files: ${changes.modified.length}`));
    console.log(chalk.blue(`Renamed files: ${changes.renamed.length}`));
    console.log(chalk.magenta(`Moved files: ${changes.moved.length}`));
    
    // Get detailed changes for modified files if requested
    if (options.detailedDiff) {
      changes.details = {};
      
      changes.modified.forEach(file => {
        try {
          const diff = execSync(
            `git diff ${prevRef} ${currRef} -- ${file}`,
            { encoding: 'utf8' }
          );
          
          // Truncate large diffs
          if (diff.length > CONFIG.maxDiffSize) {
            changes.details[file] = diff.substring(0, CONFIG.maxDiffSize) + 
              `\n\n... (diff truncated, ${Math.round(diff.length / 1024)}KB total) ...`;
          } else {
            changes.details[file] = diff;
          }
        } catch (e) {
          changes.details[file] = `Error getting diff: ${e.message}`;
        }
      });
    }
    
    return changes;
  } catch (e) {
    console.error(chalk.red(`Error analyzing file changes: ${e.message}`));
    return changes;
  }
}

/**
 * Safely execute git command and handle errors
 * @param {string} command - Git command to execute
 * @param {string} errorMessage - Message to log on error
 * @param {string} defaultValue - Default value to return on error
 * @returns {string} Command output or default value on error
 */
function safeExecSync(command, errorMessage, defaultValue = '') {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(chalk.red(`${errorMessage}: ${error.message}`));
    return defaultValue;
  }
}

/**
 * Analyze API changes
 */
function analyzeApiChanges(prevRef, currRef, fileChanges) {
  const changes = {
    interfaces: {
      added: [],
      removed: [],
      modified: [],
    },
    functions: {
      added: [],
      removed: [],
      modified: [],
    },
    components: {
      added: [],
      removed: [],
      modified: [],
    },
  };
  
  // Analyze TypeScript/JavaScript files for API changes
  const tsFiles = [
    ...fileChanges.modified,
    ...fileChanges.added,
    ...fileChanges.removed,
    ...fileChanges.renamed.map(r => r.to),
    ...fileChanges.moved.map(m => m.to),
  ].filter(file => file.endsWith('.ts') || file.endsWith('.tsx') || 
                   file.endsWith('.js') || file.endsWith('.jsx'));
  
  tsFiles.forEach(file => {
    try {
      // For modified files, compare before and after
      if (fileChanges.modified.includes(file)) {
        // Get previous content safely
        const prevContent = safeExecSync(
          `git show ${prevRef}:${file}`,
          `Error getting previous content of ${file}`,
          ''
        );
        
        // Get current content safely
        const currContent = safeExecSync(
          `git show ${currRef}:${file}`,
          `Error getting current content of ${file}`,
          ''
        );
        
        // Skip if either content couldn't be retrieved
        if (!prevContent || !currContent) {
          console.log(chalk.yellow(`Skipping API analysis for ${file} due to content retrieval issues`));
          return;
        }
        
        // Extract interfaces, functions, and components
        const prevInterfaces = extractInterfaces(prevContent);
        const currInterfaces = extractInterfaces(currContent);
        const prevFunctions = extractFunctions(prevContent);
        const currFunctions = extractFunctions(currContent);
        const prevComponents = extractComponents(prevContent);
        const currComponents = extractComponents(currContent);
        
        // Compare interfaces
        compareDefinitions(prevInterfaces, currInterfaces, changes.interfaces, file);
        
        // Compare functions
        compareDefinitions(prevFunctions, currFunctions, changes.functions, file);
        
        // Compare components
        compareDefinitions(prevComponents, currComponents, changes.components, file);
      }
      // For added files, all definitions are new
      else if (fileChanges.added.includes(file)) {
        const content = safeExecSync(
          `git show ${currRef}:${file}`,
          `Error getting content of added file ${file}`,
          ''
        );
        
        if (!content) {
          console.log(chalk.yellow(`Skipping API analysis for added file ${file} due to content retrieval issues`));
          return;
        }
        
        extractInterfaces(content).forEach(iface => {
          changes.interfaces.added.push({ name: iface, file });
        });
        
        extractFunctions(content).forEach(func => {
          changes.functions.added.push({ name: func, file });
        });
        
        extractComponents(content).forEach(comp => {
          changes.components.added.push({ name: comp, file });
        });
      }
      // For removed files, all definitions are removed
      else if (fileChanges.removed.includes(file)) {
        const content = safeExecSync(
          `git show ${prevRef}:${file}`,
          `Error getting content of removed file ${file}`,
          ''
        );
        
        if (!content) {
          console.log(chalk.yellow(`Skipping API analysis for removed file ${file} due to content retrieval issues`));
          return;
        }
        
        extractInterfaces(content).forEach(iface => {
          changes.interfaces.removed.push({ name: iface, file });
        });
        
        extractFunctions(content).forEach(func => {
          changes.functions.removed.push({ name: func, file });
        });
        
        extractComponents(content).forEach(comp => {
          changes.components.removed.push({ name: comp, file });
        });
      }
    } catch (e) {
      console.error(chalk.red(`Error analyzing API changes in ${file}: ${e.message}`));
    }
  });
  
  console.log(chalk.green(`Added interfaces: ${changes.interfaces.added.length}`));
  console.log(chalk.red(`Removed interfaces: ${changes.interfaces.removed.length}`));
  console.log(chalk.yellow(`Modified interfaces: ${changes.interfaces.modified.length}`));
  
  console.log(chalk.green(`Added functions: ${changes.functions.added.length}`));
  console.log(chalk.red(`Removed functions: ${changes.functions.removed.length}`));
  console.log(chalk.yellow(`Modified functions: ${changes.functions.modified.length}`));
  
  console.log(chalk.green(`Added components: ${changes.components.added.length}`));
  console.log(chalk.red(`Removed components: ${changes.components.removed.length}`));
  console.log(chalk.yellow(`Modified components: ${changes.components.modified.length}`));
  
  return changes;
}

/**
 * Extract interfaces from code
 */
function extractInterfaces(code) {
  const interfaces = [];
  const regex = /interface\s+(\w+)/g;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    interfaces.push(match[1]);
  }
  
  return interfaces;
}

/**
 * Extract functions from code
 */
function extractFunctions(code) {
  const functions = [];
  const regex = /function\s+(\w+)|const\s+(\w+)\s*=\s*(\([^)]*\)\s*=>|\([^)]*\)\s*async\s*=>|\s*async\s*\([^)]*\)\s*=>|\s*async\s*function)/g;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    functions.push(match[1] || match[2]);
  }
  
  return functions;
}

/**
 * Extract components from code
 */
function extractComponents(code) {
  const components = [];
  const regex = /class\s+(\w+)\s+extends\s+React\.Component|const\s+(\w+)\s*=\s*\(\s*\{[^}]*\}\s*\)\s*=>/g;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    components.push(match[1] || match[2]);
  }
  
  return components;
}

/**
 * Compare definitions between previous and current code
 */
function compareDefinitions(prevDefs, currDefs, changes, file) {
  // Find added definitions
  currDefs.forEach(def => {
    if (!prevDefs.includes(def)) {
      changes.added.push({ name: def, file });
    }
  });
  
  // Find removed definitions
  prevDefs.forEach(def => {
    if (!currDefs.includes(def)) {
      changes.removed.push({ name: def, file });
    }
  });
  
  // Find modified definitions (same name but potentially different implementation)
  const commonDefs = prevDefs.filter(def => currDefs.includes(def));
  commonDefs.forEach(def => {
    // We consider a definition modified if it appears in a modified file
    // A more sophisticated approach would analyze the actual definition changes
    changes.modified.push({ name: def, file });
  });
}

/**
 * Generate phase change report
 */
function generateReport(previousPhase, currentPhase, dirChanges, fileChanges, apiChanges, attributionInfo, options) {
  const report = [];
  
  // Report header
  report.push(`# Phase ${previousPhase} to Phase ${currentPhase} Change Report`);
  report.push('');
  report.push(`Generated on: ${new Date().toISOString().split('T')[0]}`);
  report.push('');
  report.push('## Overview');
  report.push('');
  report.push('This report documents the changes between Phase ' + previousPhase + ' and Phase ' + currentPhase + ' of the Promethios project.');
  report.push('');
  
  // Summary statistics
  report.push('### Summary Statistics');
  report.push('');
  report.push('| Category | Added | Removed | Modified | Renamed | Moved |');
  report.push('|----------|-------|---------|----------|---------|-------|');
  report.push(`| Directories | ${dirChanges.added.length} | ${dirChanges.removed.length} | ${dirChanges.modified.length} | - | - |`);
  report.push(`| Files | ${fileChanges.added.length} | ${fileChanges.removed.length} | ${fileChanges.modified.length} | ${fileChanges.renamed.length} | ${fileChanges.moved.length} |`);
  report.push(`| Interfaces | ${apiChanges.interfaces.added.length} | ${apiChanges.interfaces.removed.length} | ${apiChanges.interfaces.modified.length} | - | - |`);
  report.push(`| Functions | ${apiChanges.functions.added.length} | ${apiChanges.functions.removed.length} | ${apiChanges.functions.modified.length} | - | - |`);
  report.push(`| Components | ${apiChanges.components.added.length} | ${apiChanges.components.removed.length} | ${apiChanges.components.modified.length} | - | - |`);
  report.push('');
  
  // Attribution summary if available
  if (attributionInfo) {
    report.push('### Contributor Summary');
    report.push('');
    report.push(`Total contributors: ${attributionInfo.summary.totalContributors}`);
    report.push('');
    report.push('| Contributor | Total Changes | Files | Directories | APIs |');
    report.push('|-------------|---------------|-------|-------------|------|');
    
    attributionInfo.summary.contributors.forEach(contributor => {
      const fileChanges = contributor.contributions.files ? 
        Object.values(contributor.contributions.files).reduce((a, b) => a + b, 0) : 0;
      
      const dirChanges = contributor.contributions.directories ? 
        Object.values(contributor.contributions.directories).reduce((a, b) => a + b, 0) : 0;
      
      const apiChanges = 
        (contributor.contributions.interfaces ? 
          Object.values(contributor.contributions.interfaces).reduce((a, b) => a + b, 0) : 0) +
        (contributor.contributions.functions ? 
          Object.values(contributor.contributions.functions).reduce((a, b) => a + b, 0) : 0) +
        (contributor.contributions.components ? 
          Object.values(contributor.contributions.components).reduce((a, b) => a + b, 0) : 0);
      
      report.push(`| ${contributor.name} | ${contributor.totalContributions} | ${fileChanges} | ${dirChanges} | ${apiChanges} |`);
    });
    
    report.push('');
  }
  
  // Directory structure changes
  report.push('## Directory Structure Changes');
  report.push('');
  
  if (dirChanges.added.length > 0) {
    report.push('### Added Directories');
    report.push('');
    dirChanges.added.forEach(dir => {
      let line = `- \`${dir}/\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.directories.added[dir]) {
        const author = attributionInfo.directories.added[dir];
        line += ` (Added by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (dirChanges.removed.length > 0) {
    report.push('### Removed Directories');
    report.push('');
    dirChanges.removed.forEach(dir => {
      let line = `- \`${dir}/\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.directories.removed[dir]) {
        const author = attributionInfo.directories.removed[dir];
        line += ` (Removed by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (dirChanges.modified.length > 0) {
    report.push('### Modified Directories');
    report.push('');
    dirChanges.modified.forEach(dir => {
      let line = `- \`${dir}/\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.directories.modified[dir]) {
        const author = attributionInfo.directories.modified[dir];
        line += ` (Modified by: ${author.name}, ${author.commitCount} of ${author.totalCommits} commits)`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  // File changes
  report.push('## File Changes');
  report.push('');
  
  if (fileChanges.added.length > 0) {
    report.push('### Added Files');
    report.push('');
    fileChanges.added.forEach(file => {
      let line = `- \`${file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.files.added[file]) {
        const author = attributionInfo.files.added[file];
        line += ` (Added by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (fileChanges.removed.length > 0) {
    report.push('### Removed Files');
    report.push('');
    fileChanges.removed.forEach(file => {
      let line = `- \`${file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.files.removed[file]) {
        const author = attributionInfo.files.removed[file];
        line += ` (Removed by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (fileChanges.modified.length > 0) {
    report.push('### Modified Files');
    report.push('');
    fileChanges.modified.forEach(file => {
      let line = `- \`${file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.files.modified[file] && attributionInfo.files.modified[file].mainContributor) {
        const attribution = attributionInfo.files.modified[file];
        line += ` (Primary contributor: ${attribution.mainContributor.name}, ${attribution.mainContributor.commitCount} commits)`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (fileChanges.renamed.length > 0) {
    report.push('### Renamed Files');
    report.push('');
    fileChanges.renamed.forEach(rename => {
      let line = `- \`${rename.from}\` → \`${rename.to}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.files.renamed[`${rename.from}|${rename.to}`]) {
        const author = attributionInfo.files.renamed[`${rename.from}|${rename.to}`];
        line += ` (Renamed by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (fileChanges.moved.length > 0) {
    report.push('### Moved Files');
    report.push('');
    fileChanges.moved.forEach(move => {
      let line = `- \`${move.from}\` → \`${move.to}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.files.moved[`${move.from}|${move.to}`]) {
        const author = attributionInfo.files.moved[`${move.from}|${move.to}`];
        line += ` (Moved by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  // API changes
  report.push('## API Changes');
  report.push('');
  
  // Interface changes
  report.push('### Interface Changes');
  report.push('');
  
  if (apiChanges.interfaces.added.length > 0) {
    report.push('#### Added Interfaces');
    report.push('');
    apiChanges.interfaces.added.forEach(iface => {
      let line = `- \`${iface.name}\` in \`${iface.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.interfaces.added[`${iface.name}|${iface.file}`]) {
        const author = attributionInfo.api.interfaces.added[`${iface.name}|${iface.file}`];
        line += ` (Added by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (apiChanges.interfaces.removed.length > 0) {
    report.push('#### Removed Interfaces');
    report.push('');
    apiChanges.interfaces.removed.forEach(iface => {
      let line = `- \`${iface.name}\` from \`${iface.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.interfaces.removed[`${iface.name}|${iface.file}`]) {
        const author = attributionInfo.api.interfaces.removed[`${iface.name}|${iface.file}`];
        line += ` (Removed by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (apiChanges.interfaces.modified.length > 0) {
    report.push('#### Modified Interfaces');
    report.push('');
    apiChanges.interfaces.modified.forEach(iface => {
      let line = `- \`${iface.name}\` in \`${iface.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.interfaces.modified[`${iface.name}|${iface.file}`] && 
          attributionInfo.api.interfaces.modified[`${iface.name}|${iface.file}`].mainContributor) {
        const attribution = attributionInfo.api.interfaces.modified[`${iface.name}|${iface.file}`];
        line += ` (Modified by: ${attribution.mainContributor.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  // Function changes
  report.push('### Function Changes');
  report.push('');
  
  if (apiChanges.functions.added.length > 0) {
    report.push('#### Added Functions');
    report.push('');
    apiChanges.functions.added.forEach(func => {
      let line = `- \`${func.name}\` in \`${func.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.functions.added[`${func.name}|${func.file}`]) {
        const author = attributionInfo.api.functions.added[`${func.name}|${func.file}`];
        line += ` (Added by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (apiChanges.functions.removed.length > 0) {
    report.push('#### Removed Functions');
    report.push('');
    apiChanges.functions.removed.forEach(func => {
      let line = `- \`${func.name}\` from \`${func.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.functions.removed[`${func.name}|${func.file}`]) {
        const author = attributionInfo.api.functions.removed[`${func.name}|${func.file}`];
        line += ` (Removed by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (apiChanges.functions.modified.length > 0) {
    report.push('#### Modified Functions');
    report.push('');
    apiChanges.functions.modified.forEach(func => {
      let line = `- \`${func.name}\` in \`${func.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.functions.modified[`${func.name}|${func.file}`] && 
          attributionInfo.api.functions.modified[`${func.name}|${func.file}`].mainContributor) {
        const attribution = attributionInfo.api.functions.modified[`${func.name}|${func.file}`];
        line += ` (Modified by: ${attribution.mainContributor.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  // Component changes
  report.push('### Component Changes');
  report.push('');
  
  if (apiChanges.components.added.length > 0) {
    report.push('#### Added Components');
    report.push('');
    apiChanges.components.added.forEach(comp => {
      let line = `- \`${comp.name}\` in \`${comp.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.components.added[`${comp.name}|${comp.file}`]) {
        const author = attributionInfo.api.components.added[`${comp.name}|${comp.file}`];
        line += ` (Added by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (apiChanges.components.removed.length > 0) {
    report.push('#### Removed Components');
    report.push('');
    apiChanges.components.removed.forEach(comp => {
      let line = `- \`${comp.name}\` from \`${comp.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.components.removed[`${comp.name}|${comp.file}`]) {
        const author = attributionInfo.api.components.removed[`${comp.name}|${comp.file}`];
        line += ` (Removed by: ${author.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  if (apiChanges.components.modified.length > 0) {
    report.push('#### Modified Components');
    report.push('');
    apiChanges.components.modified.forEach(comp => {
      let line = `- \`${comp.name}\` in \`${comp.file}\``;
      
      // Add attribution if available
      if (attributionInfo && attributionInfo.api.components.modified[`${comp.name}|${comp.file}`] && 
          attributionInfo.api.components.modified[`${comp.name}|${comp.file}`].mainContributor) {
        const attribution = attributionInfo.api.components.modified[`${comp.name}|${comp.file}`];
        line += ` (Modified by: ${attribution.mainContributor.name})`;
      }
      
      report.push(line);
    });
    report.push('');
  }
  
  // Migration guide
  report.push('## Migration Guide');
  report.push('');
  report.push('This section provides guidance for developers working with code that needs to be migrated from Phase ' + previousPhase + ' to Phase ' + currentPhase + '.');
  report.push('');
  
  // Add migration notes based on significant changes
  const migrationNotes = [];
  
  // Directory structure changes
  if (dirChanges.added.length > 0 || dirChanges.removed.length > 0 || dirChanges.modified.length > 0) {
    migrationNotes.push('### Directory Structure Migration');
    migrationNotes.push('');
    
    if (dirChanges.removed.length > 0) {
      migrationNotes.push('The following directories have been removed or relocated:');
      migrationNotes.push('');
      dirChanges.removed.forEach(dir => {
        // Check if this directory was moved rather than just removed
        const possibleNewLocations = dirChanges.added.filter(newDir => {
          const oldParts = dir.split('/');
          const newParts = newDir.split('/');
          return oldParts[oldParts.length - 1] === newParts[newParts.length - 1];
        });
        
        if (possibleNewLocations.length > 0) {
          migrationNotes.push(`- \`${dir}/\` has been moved to \`${possibleNewLocations[0]}/\``);
        } else {
          migrationNotes.push(`- \`${dir}/\` has been removed`);
        }
      });
      migrationNotes.push('');
      migrationNotes.push('Update any imports or references to these directories accordingly.');
      migrationNotes.push('');
    }
  }
  
  // File movements and renames
  if (fileChanges.renamed.length > 0 || fileChanges.moved.length > 0) {
    migrationNotes.push('### File Location Changes');
    migrationNotes.push('');
    migrationNotes.push('The following files have been renamed or moved:');
    migrationNotes.push('');
    
    [...fileChanges.renamed, ...fileChanges.moved].forEach(change => {
      migrationNotes.push(`- \`${change.from}\` → \`${change.to}\``);
    });
    
    migrationNotes.push('');
    migrationNotes.push('Update any imports or references to these files accordingly.');
    migrationNotes.push('');
  }
  
  // API changes
  if (apiChanges.interfaces.removed.length > 0 || apiChanges.functions.removed.length > 0 || apiChanges.components.removed.length > 0) {
    migrationNotes.push('### API Changes');
    migrationNotes.push('');
    migrationNotes.push('The following APIs have been removed or modified:');
    migrationNotes.push('');
    
    if (apiChanges.interfaces.removed.length > 0) {
      migrationNotes.push('#### Removed Interfaces');
      migrationNotes.push('');
      apiChanges.interfaces.removed.forEach(iface => {
        migrationNotes.push(`- \`${iface.name}\` from \`${iface.file}\``);
      });
      migrationNotes.push('');
    }
    
    if (apiChanges.functions.removed.length > 0) {
      migrationNotes.push('#### Removed Functions');
      migrationNotes.push('');
      apiChanges.functions.removed.forEach(func => {
        migrationNotes.push(`- \`${func.name}\` from \`${func.file}\``);
      });
      migrationNotes.push('');
    }
    
    if (apiChanges.components.removed.length > 0) {
      migrationNotes.push('#### Removed Components');
      migrationNotes.push('');
      apiChanges.components.removed.forEach(comp => {
        migrationNotes.push(`- \`${comp.name}\` from \`${comp.file}\``);
      });
      migrationNotes.push('');
    }
    
    migrationNotes.push('Check your code for usage of these removed APIs and update accordingly.');
    migrationNotes.push('');
  }
  
  // Add migration notes to report if there are any
  if (migrationNotes.length > 0) {
    report.push(...migrationNotes);
  } else {
    report.push('No significant migration steps required for this phase transition.');
    report.push('');
  }
  
  return report.join('\n');
}

/**
 * Generate visualization of changes
 */
function generateVisualization(previousPhase, currentPhase, dirChanges, fileChanges, outputDir) {
  // This is a placeholder for future visualization implementation
  // Could generate a graph, chart, or other visual representation of changes
  console.log(chalk.yellow('Visualization generation is a placeholder for future implementation.'));
}

/**
 * Update the report index
 */
function updateReportIndex(outputDir) {
  const indexPath = path.join(outputDir, 'index.md');
  const reports = fs.readdirSync(outputDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .sort();
  
  const index = [
    '# Phase Change Reports',
    '',
    'This directory contains reports documenting changes between phases of the Promethios project.',
    '',
    '## Available Reports',
    '',
  ];
  
  reports.forEach(report => {
    const match = report.match(/phase_(.+)_to_(.+)_changes\.md/);
    if (match) {
      const [, fromPhase, toPhase] = match;
      index.push(`- [Phase ${fromPhase} to Phase ${toPhase}](${report})`);
    } else {
      index.push(`- [${report}](${report})`);
    }
  });
  
  fs.writeFileSync(indexPath, index.join('\n'));
  console.log(chalk.green(`Updated report index: ${indexPath}`));
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`\n❌ Fatal error: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});
