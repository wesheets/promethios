/**
 * Attribution Module for Phase Change Tracker
 * 
 * This module provides functionality to track which developers made specific changes
 * between phases, adding an important accountability layer to the Promethios
 * governance framework.
 */

const { execSync } = require('child_process');

/**
 * Get the author of the last change to a file
 * @param {string} file - Path to the file
 * @param {string} ref - Git reference (commit, branch, tag)
 * @returns {Object} Author information (name, email, date)
 */
function getFileAuthor(file, ref) {
  try {
    const output = execSync(
      `git log -1 --format="%an|%ae|%ad" ${ref} -- ${file}`,
      { encoding: 'utf8' }
    ).trim();
    
    if (!output) {
      return { name: 'Unknown', email: 'unknown', date: 'unknown' };
    }
    
    const [name, email, date] = output.split('|');
    return { name, email, date };
  } catch (error) {
    console.error(`Error getting author for ${file}: ${error.message}`);
    return { name: 'Unknown', email: 'unknown', date: 'unknown' };
  }
}

/**
 * Get detailed attribution information for a file
 * @param {string} file - Path to the file
 * @param {string} prevRef - Previous git reference
 * @param {string} currRef - Current git reference
 * @returns {Object} Detailed attribution information
 */
function getDetailedAttribution(file, prevRef, currRef) {
  try {
    // Get commits that modified this file between the two references
    const commits = execSync(
      `git log --format="%H|%an|%ae|%ad|%s" ${prevRef}..${currRef} -- ${file}`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
    
    if (commits.length === 0) {
      return {
        contributors: [],
        mainContributor: null,
        commitCount: 0
      };
    }
    
    // Parse commit information
    const parsedCommits = commits.map(commit => {
      const [hash, name, email, date, subject] = commit.split('|');
      return { hash, name, email, date, subject };
    });
    
    // Count contributions by author
    const contributionsByAuthor = {};
    parsedCommits.forEach(commit => {
      if (!contributionsByAuthor[commit.email]) {
        contributionsByAuthor[commit.email] = {
          name: commit.name,
          email: commit.email,
          commits: []
        };
      }
      contributionsByAuthor[commit.email].commits.push({
        hash: commit.hash,
        date: commit.date,
        subject: commit.subject
      });
    });
    
    // Convert to array and sort by number of commits
    const contributors = Object.values(contributionsByAuthor).map(contributor => ({
      name: contributor.name,
      email: contributor.email,
      commitCount: contributor.commits.length,
      commits: contributor.commits
    })).sort((a, b) => b.commitCount - a.commitCount);
    
    return {
      contributors,
      mainContributor: contributors[0] || null,
      commitCount: parsedCommits.length
    };
  } catch (error) {
    console.error(`Error getting detailed attribution for ${file}: ${error.message}`);
    return {
      contributors: [],
      mainContributor: null,
      commitCount: 0
    };
  }
}

/**
 * Get attribution information for directory changes
 * @param {Object} dirChanges - Directory change information
 * @param {string} prevRef - Previous git reference
 * @param {string} currRef - Current git reference
 * @returns {Object} Attribution information for directories
 */
function getDirectoryAttribution(dirChanges, prevRef, currRef) {
  const attribution = {
    added: {},
    removed: {},
    modified: {}
  };
  
  // For added directories, get the author of the first commit that added files to this directory
  dirChanges.added.forEach(dir => {
    try {
      // Find the first commit that added files to this directory
      const output = execSync(
        `git log --diff-filter=A --format="%an|%ae|%ad" ${currRef} -- ${dir}`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean)[0];
      
      if (output) {
        const [name, email, date] = output.split('|');
        attribution.added[dir] = { name, email, date };
      } else {
        attribution.added[dir] = { name: 'Unknown', email: 'unknown', date: 'unknown' };
      }
    } catch (error) {
      console.error(`Error getting attribution for added directory ${dir}: ${error.message}`);
      attribution.added[dir] = { name: 'Unknown', email: 'unknown', date: 'unknown' };
    }
  });
  
  // For removed directories, get the author of the commit that removed the directory
  dirChanges.removed.forEach(dir => {
    try {
      // Find the commit that removed files from this directory
      const output = execSync(
        `git log --diff-filter=D --format="%an|%ae|%ad" ${prevRef} -- ${dir}`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean)[0];
      
      if (output) {
        const [name, email, date] = output.split('|');
        attribution.removed[dir] = { name, email, date };
      } else {
        attribution.removed[dir] = { name: 'Unknown', email: 'unknown', date: 'unknown' };
      }
    } catch (error) {
      console.error(`Error getting attribution for removed directory ${dir}: ${error.message}`);
      attribution.removed[dir] = { name: 'Unknown', email: 'unknown', date: 'unknown' };
    }
  });
  
  // For modified directories, get the authors who made the most changes
  dirChanges.modified.forEach(dir => {
    try {
      // Find all commits that modified files in this directory
      const output = execSync(
        `git log --format="%an|%ae" ${prevRef}..${currRef} -- ${dir}`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean);
      
      if (output.length > 0) {
        // Count contributions by author
        const contributionsByAuthor = {};
        output.forEach(line => {
          const [name, email] = line.split('|');
          if (!contributionsByAuthor[email]) {
            contributionsByAuthor[email] = { name, email, count: 0 };
          }
          contributionsByAuthor[email].count++;
        });
        
        // Find the author with the most contributions
        const mainContributor = Object.values(contributionsByAuthor)
          .sort((a, b) => b.count - a.count)[0];
        
        attribution.modified[dir] = {
          name: mainContributor.name,
          email: mainContributor.email,
          commitCount: mainContributor.count,
          totalCommits: output.length
        };
      } else {
        attribution.modified[dir] = { name: 'Unknown', email: 'unknown', commitCount: 0, totalCommits: 0 };
      }
    } catch (error) {
      console.error(`Error getting attribution for modified directory ${dir}: ${error.message}`);
      attribution.modified[dir] = { name: 'Unknown', email: 'unknown', commitCount: 0, totalCommits: 0 };
    }
  });
  
  return attribution;
}

/**
 * Get attribution information for file changes
 * @param {Object} fileChanges - File change information
 * @param {string} prevRef - Previous git reference
 * @param {string} currRef - Current git reference
 * @returns {Object} Attribution information for files
 */
function getFileAttribution(fileChanges, prevRef, currRef) {
  const attribution = {
    added: {},
    removed: {},
    modified: {},
    renamed: {},
    moved: {}
  };
  
  // For added files, get the author of the commit that added the file
  fileChanges.added.forEach(file => {
    attribution.added[file] = getFileAuthor(file, currRef);
  });
  
  // For removed files, get the author of the commit that removed the file
  fileChanges.removed.forEach(file => {
    attribution.removed[file] = getFileAuthor(file, prevRef);
  });
  
  // For modified files, get detailed attribution information
  fileChanges.modified.forEach(file => {
    attribution.modified[file] = getDetailedAttribution(file, prevRef, currRef);
  });
  
  // For renamed files, get the author of the commit that renamed the file
  fileChanges.renamed.forEach(rename => {
    try {
      // Find the commit that renamed the file
      const output = execSync(
        `git log --follow --format="%an|%ae|%ad" -1 ${currRef} -- ${rename.to}`,
        { encoding: 'utf8' }
      ).trim();
      
      if (output) {
        const [name, email, date] = output.split('|');
        attribution.renamed[`${rename.from}|${rename.to}`] = { name, email, date };
      } else {
        attribution.renamed[`${rename.from}|${rename.to}`] = { name: 'Unknown', email: 'unknown', date: 'unknown' };
      }
    } catch (error) {
      console.error(`Error getting attribution for renamed file ${rename.from} -> ${rename.to}: ${error.message}`);
      attribution.renamed[`${rename.from}|${rename.to}`] = { name: 'Unknown', email: 'unknown', date: 'unknown' };
    }
  });
  
  // For moved files, get the author of the commit that moved the file
  fileChanges.moved.forEach(move => {
    try {
      // Find the commit that moved the file
      const output = execSync(
        `git log --follow --format="%an|%ae|%ad" -1 ${currRef} -- ${move.to}`,
        { encoding: 'utf8' }
      ).trim();
      
      if (output) {
        const [name, email, date] = output.split('|');
        attribution.moved[`${move.from}|${move.to}`] = { name, email, date };
      } else {
        attribution.moved[`${move.from}|${move.to}`] = { name: 'Unknown', email: 'unknown', date: 'unknown' };
      }
    } catch (error) {
      console.error(`Error getting attribution for moved file ${move.from} -> ${move.to}: ${error.message}`);
      attribution.moved[`${move.from}|${move.to}`] = { name: 'Unknown', email: 'unknown', date: 'unknown' };
    }
  });
  
  return attribution;
}

/**
 * Get attribution information for API changes
 * @param {Object} apiChanges - API change information
 * @param {string} prevRef - Previous git reference
 * @param {string} currRef - Current git reference
 * @returns {Object} Attribution information for API changes
 */
function getApiAttribution(apiChanges, prevRef, currRef) {
  const attribution = {
    interfaces: {
      added: {},
      removed: {},
      modified: {}
    },
    functions: {
      added: {},
      removed: {},
      modified: {}
    },
    components: {
      added: {},
      removed: {},
      modified: {}
    }
  };
  
  // Process interfaces
  apiChanges.interfaces.added.forEach(iface => {
    attribution.interfaces.added[`${iface.name}|${iface.file}`] = getFileAuthor(iface.file, currRef);
  });
  
  apiChanges.interfaces.removed.forEach(iface => {
    attribution.interfaces.removed[`${iface.name}|${iface.file}`] = getFileAuthor(iface.file, prevRef);
  });
  
  apiChanges.interfaces.modified.forEach(iface => {
    attribution.interfaces.modified[`${iface.name}|${iface.file}`] = getDetailedAttribution(iface.file, prevRef, currRef);
  });
  
  // Process functions
  apiChanges.functions.added.forEach(func => {
    attribution.functions.added[`${func.name}|${func.file}`] = getFileAuthor(func.file, currRef);
  });
  
  apiChanges.functions.removed.forEach(func => {
    attribution.functions.removed[`${func.name}|${func.file}`] = getFileAuthor(func.file, prevRef);
  });
  
  apiChanges.functions.modified.forEach(func => {
    attribution.functions.modified[`${func.name}|${func.file}`] = getDetailedAttribution(func.file, prevRef, currRef);
  });
  
  // Process components
  apiChanges.components.added.forEach(comp => {
    attribution.components.added[`${comp.name}|${comp.file}`] = getFileAuthor(comp.file, currRef);
  });
  
  apiChanges.components.removed.forEach(comp => {
    attribution.components.removed[`${comp.name}|${comp.file}`] = getFileAuthor(comp.file, prevRef);
  });
  
  apiChanges.components.modified.forEach(comp => {
    attribution.components.modified[`${comp.name}|${comp.file}`] = getDetailedAttribution(comp.file, prevRef, currRef);
  });
  
  return attribution;
}

/**
 * Generate attribution summary statistics
 * @param {Object} dirAttribution - Directory attribution information
 * @param {Object} fileAttribution - File attribution information
 * @param {Object} apiAttribution - API attribution information
 * @returns {Object} Attribution summary statistics
 */
function generateAttributionSummary(dirAttribution, fileAttribution, apiAttribution) {
  // Collect all contributors
  const contributors = {};
  
  // Process directory attributions
  Object.values(dirAttribution.added).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.directories) {
      contributors[attr.email].contributions.directories = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.directories.added++;
  });
  
  Object.values(dirAttribution.removed).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.directories) {
      contributors[attr.email].contributions.directories = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.directories.removed++;
  });
  
  Object.values(dirAttribution.modified).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.directories) {
      contributors[attr.email].contributions.directories = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.directories.modified++;
  });
  
  // Process file attributions
  Object.values(fileAttribution.added).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.files) {
      contributors[attr.email].contributions.files = { added: 0, removed: 0, modified: 0, renamed: 0, moved: 0 };
    }
    contributors[attr.email].contributions.files.added++;
  });
  
  Object.values(fileAttribution.removed).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.files) {
      contributors[attr.email].contributions.files = { added: 0, removed: 0, modified: 0, renamed: 0, moved: 0 };
    }
    contributors[attr.email].contributions.files.removed++;
  });
  
  Object.values(fileAttribution.modified).forEach(attr => {
    if (attr.mainContributor) {
      const email = attr.mainContributor.email;
      const name = attr.mainContributor.name;
      
      if (!contributors[email]) {
        contributors[email] = { name, email, contributions: {} };
      }
      if (!contributors[email].contributions.files) {
        contributors[email].contributions.files = { added: 0, removed: 0, modified: 0, renamed: 0, moved: 0 };
      }
      contributors[email].contributions.files.modified++;
    }
  });
  
  Object.values(fileAttribution.renamed).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.files) {
      contributors[attr.email].contributions.files = { added: 0, removed: 0, modified: 0, renamed: 0, moved: 0 };
    }
    contributors[attr.email].contributions.files.renamed++;
  });
  
  Object.values(fileAttribution.moved).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.files) {
      contributors[attr.email].contributions.files = { added: 0, removed: 0, modified: 0, renamed: 0, moved: 0 };
    }
    contributors[attr.email].contributions.files.moved++;
  });
  
  // Process API attributions
  // Interfaces
  Object.values(apiAttribution.interfaces.added).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.interfaces) {
      contributors[attr.email].contributions.interfaces = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.interfaces.added++;
  });
  
  Object.values(apiAttribution.interfaces.removed).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.interfaces) {
      contributors[attr.email].contributions.interfaces = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.interfaces.removed++;
  });
  
  Object.values(apiAttribution.interfaces.modified).forEach(attr => {
    if (attr.mainContributor) {
      const email = attr.mainContributor.email;
      const name = attr.mainContributor.name;
      
      if (!contributors[email]) {
        contributors[email] = { name, email, contributions: {} };
      }
      if (!contributors[email].contributions.interfaces) {
        contributors[email].contributions.interfaces = { added: 0, removed: 0, modified: 0 };
      }
      contributors[email].contributions.interfaces.modified++;
    }
  });
  
  // Functions
  Object.values(apiAttribution.functions.added).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.functions) {
      contributors[attr.email].contributions.functions = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.functions.added++;
  });
  
  Object.values(apiAttribution.functions.removed).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.functions) {
      contributors[attr.email].contributions.functions = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.functions.removed++;
  });
  
  Object.values(apiAttribution.functions.modified).forEach(attr => {
    if (attr.mainContributor) {
      const email = attr.mainContributor.email;
      const name = attr.mainContributor.name;
      
      if (!contributors[email]) {
        contributors[email] = { name, email, contributions: {} };
      }
      if (!contributors[email].contributions.functions) {
        contributors[email].contributions.functions = { added: 0, removed: 0, modified: 0 };
      }
      contributors[email].contributions.functions.modified++;
    }
  });
  
  // Components
  Object.values(apiAttribution.components.added).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.components) {
      contributors[attr.email].contributions.components = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.components.added++;
  });
  
  Object.values(apiAttribution.components.removed).forEach(attr => {
    if (!contributors[attr.email]) {
      contributors[attr.email] = { name: attr.name, email: attr.email, contributions: {} };
    }
    if (!contributors[attr.email].contributions.components) {
      contributors[attr.email].contributions.components = { added: 0, removed: 0, modified: 0 };
    }
    contributors[attr.email].contributions.components.removed++;
  });
  
  Object.values(apiAttribution.components.modified).forEach(attr => {
    if (attr.mainContributor) {
      const email = attr.mainContributor.email;
      const name = attr.mainContributor.name;
      
      if (!contributors[email]) {
        contributors[email] = { name, email, contributions: {} };
      }
      if (!contributors[email].contributions.components) {
        contributors[email].contributions.components = { added: 0, removed: 0, modified: 0 };
      }
      contributors[email].contributions.components.modified++;
    }
  });
  
  // Calculate total contributions for each contributor
  Object.values(contributors).forEach(contributor => {
    let total = 0;
    
    if (contributor.contributions.directories) {
      total += contributor.contributions.directories.added;
      total += contributor.contributions.directories.removed;
      total += contributor.contributions.directories.modified;
    }
    
    if (contributor.contributions.files) {
      total += contributor.contributions.files.added;
      total += contributor.contributions.files.removed;
      total += contributor.contributions.files.modified;
      total += contributor.contributions.files.renamed;
      total += contributor.contributions.files.moved;
    }
    
    if (contributor.contributions.interfaces) {
      total += contributor.contributions.interfaces.added;
      total += contributor.contributions.interfaces.removed;
      total += contributor.contributions.interfaces.modified;
    }
    
    if (contributor.contributions.functions) {
      total += contributor.contributions.functions.added;
      total += contributor.contributions.functions.removed;
      total += contributor.contributions.functions.modified;
    }
    
    if (contributor.contributions.components) {
      total += contributor.contributions.components.added;
      total += contributor.contributions.components.removed;
      total += contributor.contributions.components.modified;
    }
    
    contributor.totalContributions = total;
  });
  
  // Convert to array and sort by total contributions
  const sortedContributors = Object.values(contributors)
    .sort((a, b) => b.totalContributions - a.totalContributions);
  
  return {
    contributors: sortedContributors,
    totalContributors: sortedContributors.length
  };
}

module.exports = {
  getFileAuthor,
  getDetailedAttribution,
  getDirectoryAttribution,
  getFileAttribution,
  getApiAttribution,
  generateAttributionSummary
};
