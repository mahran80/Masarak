const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{1F201}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}-\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}\u{1F251}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

const emojiToIconMap = {
  '🎓': 'academic-cap',
  '📚': 'book-open',
  '💬': 'chat',
  '📢': 'bell',
  '🔔': 'bell',
  '📅': 'calendar',
  '📈': 'chart',
  '📉': 'chart',
  '📊': 'chart',
  '🎉': 'sparkles',
  '🌟': 'sparkles',
  '⭐': 'sparkles',
  '✨': 'sparkles',
  '💡': 'sparkles',
  '⚠️': 'exclamation-triangle',
  '⚠': 'exclamation-triangle',
  '❌': 'x-mark',
  '✕': 'x-mark',
  '🚫': 'x-mark',
  '✅': 'check-circle',
  '✓': 'check',
  '❤️': '', 
  '💔': 'x-mark',
  '💵': 'credit-card',
  '💰': 'wallet',
  '💳': 'credit-card',
  '⚙️': 'settings',
  '⚙': 'settings',
  '👥': 'users',
  '👤': 'user',
  '🤖': 'robot',
  '📹': 'video',
  '🎬': 'video',
  '⏳': 'clock',
  '🕒': 'clock',
  '📝': 'pencil',
  '✏️': 'pencil',
  '✏': 'pencil',
  '📋': 'clipboard',
  '📄': 'document-text',
  '➕': 'plus',
  '🔒': 'lock',
  '🔐': 'lock',
  '🔍': 'search',
  '📧': 'mail',
  '📭': 'mail',
  '🛡': 'shield',
  '🖥': 'globe',
  '🎫': 'credit-card',
  '🗺': 'globe',
  '🏢': 'building',
  '🔧': 'settings',
  '💾': 'archive',
  '🔇': 'volume',
  '▶': 'play-circle',
  '🧠': 'sparkles',
  '📁': 'folder',
  '📂': 'folder-open',
  '📤': 'upload',
  '☰': 'bars-3',
  '↗': 'arrow-top-right-on-square',
  '🗑': 'trash',
  '🔗': 'link',
  '📎': 'link',
  '⬅': 'arrow-left',
  '🏆': 'trophy',
  '👋': 'hand',
  '👑': 'trophy',
  '👍': 'check-badge'
};

const ZWJMappings = {
  '👨‍🏫': 'academic-cap',
  '👩‍🏫': 'academic-cap',
  '👨‍🎓': 'academic-cap',
  '👩‍🎓': 'academic-cap',
  '👨‍👧‍👦': 'family',
};

function buildTag(iconName) {
  return `<app-icon name="${iconName}" size="1.2em"></app-icon>`;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const [emoji, iconName] of Object.entries(ZWJMappings)) {
    if (content.includes(emoji)) {
      content = content.split(emoji).join(buildTag(iconName));
    }
  }
  
  content = content.replace(/👨\s*🏫/g, buildTag('academic-cap'));
  content = content.replace(/👩\s*🏫/g, buildTag('academic-cap'));
  content = content.replace(/👨\s*🎓/g, buildTag('academic-cap'));
  content = content.replace(/👩\s*🎓/g, buildTag('academic-cap'));
  content = content.replace(/👨\s*👧\s*👦/g, buildTag('family'));
  content = content.replace(/👦👧/g, buildTag('family'));

  content = content.replace(emojiRegex, (match) => {
    if (match === '❤️' || match === '❤') return '';
    const iconName = emojiToIconMap[match];
    if (iconName !== undefined) {
      if (iconName === '') return '';
      return buildTag(iconName);
    }
    return '';
  });

  if (content !== originalContent) {
    if (filePath.endsWith('.ts')) {
      const hasIconUse = content.includes('<app-icon');
      if (hasIconUse && !content.includes('IconComponent')) {
        const iconPath = 'src/app/shared/components/icon/icon.component';
        const fileDir = path.dirname(filePath);
        const absoluteIconPath = path.resolve('d:/ITI/GradProj/Masarak/MasarkFront/MasarkFront-main', iconPath);
        let relativePath = path.relative(fileDir, absoluteIconPath);
        relativePath = relativePath.replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

        const importLine = `import { IconComponent } from '${relativePath}';\n`;
        content = importLine + content;

        content = content.replace(/imports:\s*\[([\s\S]*?)\]/, (match, p1) => {
          return `imports: [IconComponent, ${p1}]`;
        });
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);

    if (filePath.endsWith('.html')) {
      const tsPath = filePath.replace('.html', '.ts');
      const tsCompPath = filePath.replace('.html', '.component.ts');
      
      const targetTsPath = fs.existsSync(tsPath) ? tsPath : (fs.existsSync(tsCompPath) ? tsCompPath : null);
      
      if (targetTsPath) {
        let tsContent = fs.readFileSync(targetTsPath, 'utf8');
        if (tsContent.includes('standalone: true') && !tsContent.includes('IconComponent')) {
           const iconPath = 'src/app/shared/components/icon/icon.component';
           const fileDir = path.dirname(targetTsPath);
           const absoluteIconPath = path.resolve('d:/ITI/GradProj/Masarak/MasarkFront/MasarkFront-main', iconPath);
           let relativePath = path.relative(fileDir, absoluteIconPath);
           relativePath = relativePath.replace(/\\/g, '/');
           if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

           const importLine = `import { IconComponent } from '${relativePath}';\n`;
           tsContent = importLine + tsContent;

           tsContent = tsContent.replace(/imports:\s*\[([\s\S]*?)\]/, (match, p1) => {
             return `imports: [IconComponent, ${p1}]`;
           });
           fs.writeFileSync(targetTsPath, tsContent, 'utf8');
           console.log(`Updated TS file for HTML: ${targetTsPath}`);
        }
      }
    }
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

processDir('d:/ITI/GradProj/Masarak/MasarkFront/MasarkFront-main/src/app');
