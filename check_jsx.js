const fs = require('fs');

const content = fs.readFileSync('/home/ubuntu/promethios/phase_7_1_prototype/promethios-ui/src/components/collaboration/AlwaysOpenCollaborationPanel.tsx', 'utf8');
const lines = content.split('\n');

let openTags = [];
let errors = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Find opening tags
  const openMatches = line.match(/<([A-Z][a-zA-Z]*)[^>]*(?<!\/)\>/g);
  if (openMatches) {
    openMatches.forEach(match => {
      const tagName = match.match(/<([A-Z][a-zA-Z]*)/)[1];
      openTags.push({ tag: tagName, line: lineNum });
    });
  }
  
  // Find closing tags
  const closeMatches = line.match(/<\/([A-Z][a-zA-Z]*)\>/g);
  if (closeMatches) {
    closeMatches.forEach(match => {
      const tagName = match.match(/<\/([A-Z][a-zA-Z]*)/)[1];
      const lastOpen = openTags.findLastIndex(t => t.tag === tagName);
      if (lastOpen >= 0) {
        openTags.splice(lastOpen, 1);
      } else {
        errors.push(`Line ${lineNum}: Closing tag </${tagName}> without matching opening tag`);
      }
    });
  }
  
  // Find self-closing tags and remove them from consideration
  const selfClosingMatches = line.match(/<([A-Z][a-zA-Z]*)[^>]*\/\>/g);
  if (selfClosingMatches) {
    selfClosingMatches.forEach(match => {
      const tagName = match.match(/<([A-Z][a-zA-Z]*)/)[1];
      // Remove from openTags if it was added
      const lastOpen = openTags.findLastIndex(t => t.tag === tagName);
      if (lastOpen >= 0) {
        openTags.splice(lastOpen, 1);
      }
    });
  }
}

console.log('Unclosed tags:');
openTags.forEach(tag => {
  console.log(`Line ${tag.line}: <${tag.tag}> is not closed`);
});

console.log('\nErrors:');
errors.forEach(error => console.log(error));

console.log(`\nTotal unclosed tags: ${openTags.length}`);

