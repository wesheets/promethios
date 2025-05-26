/**
 * Interactive Visualization Module for Phase Change Tracker
 * 
 * This module enhances the Phase Change Tracker with interactive visualizations
 * for better understanding of changes between phases.
 */

const fs = require('fs');
const path = require('path');

/**
 * Visualization Manager class
 */
class VisualizationManager {
  /**
   * Generate directory structure visualization
   */
  generateDirectoryVisualization(report) {
    // Create a tree representation of the directory structure
    const tree = {
      name: 'root',
      children: []
    };
    
    // Helper function to add a path to the tree
    const addPathToTree = (tree, pathParts) => {
      if (pathParts.length === 0) return;
      
      const part = pathParts[0];
      let child = tree.children.find(c => c.name === part);
      
      if (!child) {
        child = { name: part, children: [] };
        tree.children.push(child);
      }
      
      addPathToTree(child, pathParts.slice(1));
    };
    
    // Add all directories to the tree
    const allDirs = [
      ...report.dirChanges.added.map(dir => ({ path: dir, status: 'added' })),
      ...report.dirChanges.removed.map(dir => ({ path: dir, status: 'removed' })),
      ...report.dirChanges.modified.map(dir => ({ path: dir, status: 'modified' }))
    ];
    
    for (const dir of allDirs) {
      const pathParts = dir.path.split('/');
      addPathToTree(tree, pathParts);
    }
    
    // Generate D3.js compatible JSON for visualization
    const d3Tree = this.convertToD3Format(tree);
    
    // Generate HTML visualization
    const html = this.generateDirectoryVisualizationHtml(d3Tree, report);
    
    // Save visualization to file
    const visualizationDir = path.join(process.cwd(), 'phase_changes', 'visualizations');
    if (!fs.existsSync(visualizationDir)) {
      fs.mkdirSync(visualizationDir, { recursive: true });
    }
    
    const filename = `phase_${report.previousPhase}_to_${report.currentPhase}_directory_visualization.html`;
    const filePath = path.join(visualizationDir, filename);
    
    fs.writeFileSync(filePath, html);
    
    return {
      type: 'directory',
      path: filePath,
      relativePath: path.join('phase_changes', 'visualizations', filename)
    };
  }
  
  /**
   * Convert tree to D3.js format
   */
  convertToD3Format(node) {
    const result = {
      name: node.name,
      status: node.status
    };
    
    if (node.children && node.children.length > 0) {
      result.children = node.children.map(child => this.convertToD3Format(child));
    }
    
    return result;
  }
  
  /**
   * Generate HTML for directory visualization
   */
  generateDirectoryVisualizationHtml(treeData, report) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Directory Structure Changes: Phase ${report.previousPhase} to ${report.currentPhase}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    
    h1 {
      color: #333;
    }
    
    .node circle {
      fill: #fff;
      stroke: steelblue;
      stroke-width: 3px;
    }
    
    .node text {
      font: 12px sans-serif;
    }
    
    .link {
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }
    
    .added circle {
      stroke: #28a745;
    }
    
    .removed circle {
      stroke: #dc3545;
    }
    
    .modified circle {
      stroke: #ffc107;
    }
    
    .legend {
      margin-top: 20px;
    }
    
    .legend-item {
      display: inline-block;
      margin-right: 20px;
    }
    
    .legend-color {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 5px;
    }
    
    .legend-color.added {
      background-color: #28a745;
    }
    
    .legend-color.removed {
      background-color: #dc3545;
    }
    
    .legend-color.modified {
      background-color: #ffc107;
    }
    
    .legend-color.unchanged {
      background-color: steelblue;
    }
  </style>
  <script src="https://d3js.org/d3.v5.min.js"></script>
</head>
<body>
  <h1>Directory Structure Changes: Phase ${report.previousPhase} to ${report.currentPhase}</h1>
  
  <div class="legend">
    <div class="legend-item">
      <span class="legend-color added"></span>
      <span>Added</span>
    </div>
    <div class="legend-item">
      <span class="legend-color removed"></span>
      <span>Removed</span>
    </div>
    <div class="legend-item">
      <span class="legend-color modified"></span>
      <span>Modified</span>
    </div>
    <div class="legend-item">
      <span class="legend-color unchanged"></span>
      <span>Unchanged</span>
    </div>
  </div>
  
  <div id="tree-container"></div>
  
  <script>
    // Tree data
    const treeData = ${JSON.stringify(treeData)};
    
    // Set up the D3 visualization
    const margin = {top: 20, right: 90, bottom: 30, left: 90};
    const width = 960 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;
    
    const svg = d3.select("#tree-container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    const i = 0;
    const duration = 750;
    
    const tree = d3.tree().size([height, width]);
    
    const root = d3.hierarchy(treeData, d => d.children);
    root.x0 = height / 2;
    root.y0 = 0;
    
    update(root);
    
    function update(source) {
      // Compute the new tree layout
      const treeData = tree(root);
      
      // Get nodes and links
      const nodes = treeData.descendants();
      const links = treeData.descendants().slice(1);
      
      // Normalize for fixed-depth
      nodes.forEach(d => { d.y = d.depth * 180 });
      
      // Update the nodes
      const node = svg.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));
      
      // Enter new nodes
      const nodeEnter = node.enter().append('g')
        .attr('class', d => {
          let status = '';
          if (d.data.status === 'added') status = 'added';
          else if (d.data.status === 'removed') status = 'removed';
          else if (d.data.status === 'modified') status = 'modified';
          return 'node ' + status;
        })
        .attr('transform', d => 'translate(' + source.y0 + ',' + source.x0 + ')')
        .on('click', click);
      
      // Add circles
      nodeEnter.append('circle')
        .attr('r', 1e-6)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff');
      
      // Add labels
      nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -13 : 13)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .text(d => d.data.name);
      
      // Update the nodes
      const nodeUpdate = nodeEnter.merge(node);
      
      nodeUpdate.transition()
        .duration(duration)
        .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');
      
      nodeUpdate.select('circle')
        .attr('r', 10)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff');
      
      // Remove exiting nodes
      const nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', d => 'translate(' + source.y + ',' + source.x + ')')
        .remove();
      
      nodeExit.select('circle')
        .attr('r', 1e-6);
      
      nodeExit.select('text')
        .style('fill-opacity', 1e-6);
      
      // Update the links
      const link = svg.selectAll('path.link')
        .data(links, d => d.id);
      
      // Enter new links
      const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
          const o = {x: source.x0, y: source.y0};
          return diagonal(o, o);
        });
      
      // Update links
      const linkUpdate = linkEnter.merge(link);
      
      linkUpdate.transition()
        .duration(duration)
        .attr('d', d => diagonal(d, d.parent));
      
      // Remove exiting links
      link.exit().transition()
        .duration(duration)
        .attr('d', d => {
          const o = {x: source.x, y: source.y};
          return diagonal(o, o);
        })
        .remove();
      
      // Store the old positions for transition
      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
      
      // Toggle children on click
      function click(d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      }
      
      // Creates a curved path between nodes
      function diagonal(s, d) {
        return 'M ' + s.y + ' ' + s.x +
          ' C ' + (s.y + d.y) / 2 + ' ' + s.x +
          ', ' + (s.y + d.y) / 2 + ' ' + d.x +
          ', ' + d.y + ' ' + d.x;
      }
    }
  </script>
</body>
</html>
    `;
  }
  
  /**
   * Generate component relationship visualization
   */
  generateComponentVisualization(report) {
    // Extract components and their relationships
    const components = new Set();
    const relationships = [];
    
    // Add components from API changes
    if (report.apiChanges && report.apiChanges.components) {
      for (const comp of report.apiChanges.components.added) {
        components.add(comp.name);
      }
      
      for (const comp of report.apiChanges.components.removed) {
        components.add(comp.name);
      }
      
      for (const comp of report.apiChanges.components.modified) {
        components.add(comp.name);
      }
    }
    
    // Add interfaces from API changes
    if (report.apiChanges && report.apiChanges.interfaces) {
      for (const intf of report.apiChanges.interfaces.added) {
        components.add(intf.name);
      }
      
      for (const intf of report.apiChanges.interfaces.removed) {
        components.add(intf.name);
      }
      
      for (const intf of report.apiChanges.interfaces.modified) {
        components.add(intf.name);
      }
    }
    
    // Extract relationships from imports (if available)
    if (report.apiChanges && report.apiChanges.imports) {
      for (const imp of report.apiChanges.imports) {
        relationships.push({
          source: imp.importer,
          target: imp.imported,
          type: 'imports'
        });
      }
    }
    
    // Generate D3.js force-directed graph data
    const graphData = {
      nodes: Array.from(components).map(name => ({ id: name })),
      links: relationships
    };
    
    // Generate HTML visualization
    const html = this.generateComponentVisualizationHtml(graphData, report);
    
    // Save visualization to file
    const visualizationDir = path.join(process.cwd(), 'phase_changes', 'visualizations');
    if (!fs.existsSync(visualizationDir)) {
      fs.mkdirSync(visualizationDir, { recursive: true });
    }
    
    const filename = `phase_${report.previousPhase}_to_${report.currentPhase}_component_visualization.html`;
    const filePath = path.join(visualizationDir, filename);
    
    fs.writeFileSync(filePath, html);
    
    return {
      type: 'component',
      path: filePath,
      relativePath: path.join('phase_changes', 'visualizations', filename)
    };
  }
  
  /**
   * Generate HTML for component visualization
   */
  generateComponentVisualizationHtml(graphData, report) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Component Relationships: Phase ${report.previousPhase} to ${report.currentPhase}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    
    h1 {
      color: #333;
    }
    
    .links line {
      stroke: #999;
      stroke-opacity: 0.6;
    }
    
    .nodes circle {
      stroke: #fff;
      stroke-width: 1.5px;
    }
    
    .node-label {
      font-size: 10px;
      pointer-events: none;
    }
    
    .legend {
      margin-top: 20px;
    }
    
    .legend-item {
      display: inline-block;
      margin-right: 20px;
    }
    
    .legend-color {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 5px;
    }
  </style>
  <script src="https://d3js.org/d3.v5.min.js"></script>
</head>
<body>
  <h1>Component Relationships: Phase ${report.previousPhase} to ${report.currentPhase}</h1>
  
  <div id="graph-container"></div>
  
  <script>
    // Graph data
    const graphData = ${JSON.stringify(graphData)};
    
    // Set up the D3 visualization
    const width = 960;
    const height = 600;
    
    const svg = d3.select("#graph-container").append("svg")
      .attr("width", width)
      .attr("height", height);
    
    const simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));
    
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.links)
      .enter().append("line")
      .attr("stroke-width", 2);
    
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(graphData.nodes)
      .enter().append("g");
    
    node.append("circle")
      .attr("r", 10)
      .attr("fill", d => getNodeColor(d))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    node.append("text")
      .attr("class", "node-label")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(d => d.id);
    
    simulation
      .nodes(graphData.nodes)
      .on("tick", ticked);
    
    simulation.force("link")
      .links(graphData.links);
    
    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    }
    
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
    
    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    function getNodeColor(node) {
      // You can customize this based on node type or status
      return "#1f77b4";
    }
  </script>
</body>
</html>
    `;
  }
  
  /**
   * Generate contributor visualization
   */
  generateContributorVisualization(report) {
    if (!report.attribution || !report.attribution.summary) {
      return null;
    }
    
    // Extract contributor data
    const contributors = {};
    
    // Count contributions by file type
    for (const file of report.attribution.addedFiles) {
      for (const contributor of file.contributors) {
        if (!contributors[contributor]) {
          contributors[contributor] = { added: 0, modified: 0, removed: 0 };
        }
        contributors[contributor].added++;
      }
    }
    
    for (const file of report.attribution.modifiedFiles) {
      for (const contributor of file.contributors) {
        if (!contributors[contributor]) {
          contributors[contributor] = { added: 0, modified: 0, removed: 0 };
        }
        contributors[contributor].modified++;
      }
    }
    
    for (const file of report.attribution.removedFiles) {
      for (const contributor of file.contributors) {
        if (!contributors[contributor]) {
          contributors[contributor] = { added: 0, modified: 0, removed: 0 };
        }
        contributors[contributor].removed++;
      }
    }
    
    // Convert to array for D3
    const contributorData = Object.entries(contributors).map(([name, counts]) => ({
      name,
      added: counts.added,
      modified: counts.modified,
      removed: counts.removed,
      total: counts.added + counts.modified + counts.removed
    }));
    
    // Sort by total contributions
    contributorData.sort((a, b) => b.total - a.total);
    
    // Generate HTML visualization
    const html = this.generateContributorVisualizationHtml(contributorData, report);
    
    // Save visualization to file
    const visualizationDir = path.join(process.cwd(), 'phase_changes', 'visualizations');
    if (!fs.existsSync(visualizationDir)) {
      fs.mkdirSync(visualizationDir, { recursive: true });
    }
    
    const filename = `phase_${report.previousPhase}_to_${report.currentPhase}_contributor_visualization.html`;
    const filePath = path.join(visualizationDir, filename);
    
    fs.writeFileSync(filePath, html);
    
    return {
      type: 'contributor',
      path: filePath,
      relativePath: path.join('phase_changes', 'visualizations', filename)
    };
  }
  
  /**
   * Generate HTML for contributor visualization
   */
  generateContributorVisualizationHtml(contributorData, report) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contributor Analysis: Phase ${report.previousPhase} to ${report.currentPhase}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    
    h1 {
      color: #333;
    }
    
    .bar {
      fill-opacity: 0.8;
    }
    
    .bar.added {
      fill: #28a745;
    }
    
    .bar.modified {
      fill: #ffc107;
    }
    
    .bar.removed {
      fill: #dc3545;
    }
    
    .axis text {
      font-size: 10px;
    }
    
    .axis path,
    .axis line {
      fill: none;
      stroke: #000;
      shape-rendering: crispEdges;
    }
    
    .legend {
      margin-top: 20px;
    }
    
    .legend-item {
      display: inline-block;
      margin-right: 20px;
    }
    
    .legend-color {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-right: 5px;
    }
    
    .legend-color.added {
      background-color: #28a745;
    }
    
    .legend-color.modified {
      background-color: #ffc107;
    }
    
    .legend-color.removed {
      background-color: #dc3545;
    }
  </style>
  <script src="https://d3js.org/d3.v5.min.js"></script>
</head>
<body>
  <h1>Contributor Analysis: Phase ${report.previousPhase} to ${report.currentPhase}</h1>
  
  <div class="legend">
    <div class="legend-item">
      <span class="legend-color added"></span>
      <span>Added Files</span>
    </div>
    <div class="legend-item">
      <span class="legend-color modified"></span>
      <span>Modified Files</span>
    </div>
    <div class="legend-item">
      <span class="legend-color removed"></span>
      <span>Removed Files</span>
    </div>
  </div>
  
  <div id="chart-container"></div>
  
  <script>
    // Contributor data
    const contributorData = ${JSON.stringify(contributorData)};
    
    // Set up the D3 visualization
    const margin = {top: 20, right: 20, bottom: 30, left: 100};
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    const svg = d3.select("#chart-container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Set up scales
    const x = d3.scaleLinear()
      .range([0, width]);
    
    const y = d3.scaleBand()
      .range([0, height])
      .padding(0.1);
    
    // Set domains
    x.domain([0, d3.max(contributorData, d => d.total)]);
    y.domain(contributorData.map(d => d.name));
    
    // Add x-axis
    svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
    
    // Add y-axis
    svg.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y));
    
    // Create stacked data
    const stackedData = contributorData.map(d => {
      let xOffset = 0;
      const result = [];
      
      // Added files
      result.push({
        name: d.name,
        type: 'added',
        value: d.added,
        x0: xOffset,
        x1: xOffset + d.added
      });
      xOffset += d.added;
      
      // Modified files
      result.push({
        name: d.name,
        type: 'modified',
        value: d.modified,
        x0: xOffset,
        x1: xOffset + d.modified
      });
      xOffset += d.modified;
      
      // Removed files
      result.push({
        name: d.name,
        type: 'removed',
        value: d.removed,
        x0: xOffset,
        x1: xOffset + d.removed
      });
      
      return result;
    });
    
    // Create groups for each contributor
    const contributorGroups = svg.selectAll(".contributor")
      .data(stackedData)
      .enter().append("g")
      .attr("class", "contributor");
    
    // Add bars for each contribution type
    contributorGroups.selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("class", d => "bar " + d.type)
      .attr("x", d => x(d.x0))
      .attr("y", d => y(d.name))
      .attr("width", d => x(d.value))
      .attr("height", y.bandwidth())
      .append("title")
      .text(d => d.type + ": " + d.value);
  </script>
</body>
</html>
    `;
  }
  
  /**
   * Enhance report with visualizations
   */
  enhanceReportWithVisualizations(report) {
    // Add visualizations to the report
    report.visualizations = [];
    
    // Generate directory structure visualization
    const directoryViz = this.generateDirectoryVisualization(report);
    if (directoryViz) {
      report.visualizations.push(directoryViz);
    }
    
    // Generate component relationship visualization
    const componentViz = this.generateComponentVisualization(report);
    if (componentViz) {
      report.visualizations.push(componentViz);
    }
    
    // Generate contributor visualization if attribution data is available
    if (report.attribution) {
      const contributorViz = this.generateContributorVisualization(report);
      if (contributorViz) {
        report.visualizations.push(contributorViz);
      }
    }
    
    return report;
  }
}

module.exports = new VisualizationManager();
