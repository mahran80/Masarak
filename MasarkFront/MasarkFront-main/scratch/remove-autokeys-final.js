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

        // Catch everything related to AUTO.KEY
        newContent = newContent.replace(/AUTO\.KEY_\d+/gi, '');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Removed AUTO.KEY from', filePath);
        }
    }
});
