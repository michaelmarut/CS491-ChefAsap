const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, filelist);
    } else if (/\.jsx?$/.test(file)) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

const root = path.join(__dirname, '..', 'frontend', 'app');
if (!fs.existsSync(root)) {
  console.error('frontend/app not found');
  process.exit(1);
}

const files = walk(root);
const re = />\s*([^<\s{][^<]*)\s*<\/(?:View|ScrollView|TouchableOpacity|SafeAreaView|View>)/g; // crude

let matches = [];

files.forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  // find lines where a tag contains direct text (not nested in <Text>)
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // crude check: if line contains closing tag of common containers and has text between ><
    const m = line.match(/>\s*([^<\s{][^<]*)\s*</);
    if (m) {
      // make sure it's not within a <Text>
      const before = src.slice(0, src.indexOf(line));
      const lastOpenText = before.lastIndexOf('<Text');
      const lastCloseText = before.lastIndexOf('</Text>');
      if (lastOpenText === -1 || lastCloseText > lastOpenText) {
        matches.push({ file: f, line: i+1, text: m[1].trim(), code: line.trim() });
      }
    }
  }
});

if (matches.length === 0) {
  console.log('No obvious unwrapped text found (crude scan).');
  process.exit(0);
}

console.log('Potential unwrapped text occurrences (crude scan):');
matches.forEach(m => {
  console.log(`${m.file}:${m.line} -> ${m.text}`);
  console.log(`  ${m.code}`);
});
process.exit(0);
