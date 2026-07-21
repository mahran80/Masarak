const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const dir = 'd:\\ITI\\GradProj\\Masarak\\MasarkFront\\MasarkFront-main\\src';

walkDir(dir, function(filePath) {
    if (filePath.endsWith('.html') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        // Remove {{ 'AUTO.KEY_...' }} completely
        newContent = newContent.replace(/\{\{\s*['"]AUTO\.KEY_\d+['"]\s*\}\}/g, '');
        // Remove just the string 'AUTO.KEY_...' which might be left over from removing the pipe
        newContent = newContent.replace(/['"]AUTO\.KEY_\d+['"]/g, '');
        // Also catch any instances where it might be in brackets like [title]="'AUTO.KEY_1'"
        newContent = newContent.replace(/\[\w+\]\s*=\s*['"]\s*['"]AUTO\.KEY_\d+['"]\s*['"]/g, '');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Removed AUTO.KEY_ from', filePath);
        }
    }
});
