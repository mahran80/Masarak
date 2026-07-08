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
        let originalContent = content;

        // Remove dir="rtl" or dir='rtl'
        content = content.replace(/\s*dir=["']rtl["']/g, '');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Removed RTL dir from', filePath);
        }
    }
});
