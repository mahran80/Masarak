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
    if (filePath.endsWith('.ts') || filePath.endsWith('.html')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Remove pipe usage from template strings and html files
        // Match ` | translate` and optional arguments `:arg`
        content = content.replace(/\s*\|\s*translate(:[^\s}"\']*)?/g, '');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated HTML/Template pipe usage', filePath);
        }
    }
});
