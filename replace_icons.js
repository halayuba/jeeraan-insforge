const fs = require('fs');
const path = require('path');

const mapping = {
  'home': 'Home',
  'person': 'User',
  'help': 'HelpCircle',
  'menu': 'Menu',
  'notifications': 'Bell',
  'add': 'Plus',
  'arrow-back': 'ArrowLeft',
  'check': 'Check',
  'close': 'X',
  'share-location': 'MapPin',
  'help-outline': 'HelpCircle',
  'groups': 'Users',
  'campaign': 'Megaphone',
  'volunteer-activism': 'HeartHandshake',
  'how-to-vote': 'Vote',
  'event': 'Calendar',
  'forum': 'MessageSquare',
  'swipe': 'MoveHorizontal',
  'analytics': 'BarChart3',
  'search': 'Search',
  'edit': 'Edit',
  'delete': 'Trash2',
  'send': 'Send',
  'image': 'Image',
  'info': 'Info',
  'warning': 'AlertTriangle',
  'error': 'AlertCircle',
  'success': 'CheckCircle2',
  'construction': 'Wrench',
  'sell': 'Tag',
  'featured-play-list': 'Layout',
  'feedback': 'AlertCircle',
  'person-add': 'UserPlus',
  'arrow-forward': 'ArrowRight',
  'location-on': 'MapPin',
  'history': 'History',
  'filter-list': 'Filter',
  'sort': 'SortAsc',
  'more-vert': 'MoreVertical',
  'check-circle': 'CheckCircle2',
  'admin-panel-settings': 'ShieldAlert',
  'add-circle': 'PlusCircle',
  'storefront': 'Store',
  'security': 'Shield',
  'expand-more': 'ChevronDown',
  'expand-less': 'ChevronUp',
  'schedule': 'Clock',
  'info-outline': 'Info',
  'calendar-today': 'Calendar',
  'event-available': 'CalendarCheck',
  'camera-alt': 'Camera',
  'account-box': 'UserSquare2',
  'chevron-right': 'ChevronRight',
  'chevron-left': 'ChevronLeft',
  'arrow-back-ios': 'ChevronLeft',
  'email': 'Mail',
  'phone': 'Phone',
  'cake': 'Cake',
  'language': 'Globe',
  'work': 'Briefcase',
  'pause-circle-filled': 'PauseCircle',
  'delete-forever': 'Trash2',
  'delete-outline': 'Trash2',
  'chat-bubble': 'MessageCircle',
  'chat-bubble-outline': 'MessageCircle',
  'visibility': 'Eye',
  'add-a-photo': 'Camera',
  'share': 'Share2',
  'contact-phone': 'Contact',
  'chat': 'MessageSquare',
  'cloud-upload': 'CloudUpload',
  'person-pin': 'MapPin',
  'account-circle': 'UserCircle2',
  'thumb-up': 'ThumbsUp',
  'add-comment': 'MessageSquarePlus',
  'vpn-key': 'Key',
  'keyboard-arrow-up': 'ChevronUp',
  'keyboard-arrow-down': 'ChevronDown',
  'announcement': 'Megaphone',
  'engineering': 'Wrench',
  'star': 'Star',
  'star-border': 'Star',
  'star-half': 'StarHalf'
};

const files = [
  'src/components/Toast.tsx',
  'src/app/(app)/faq.tsx',
  'src/app/(app)/classifieds/create.tsx',
  'src/app/(app)/classifieds/[id].tsx',
  'src/app/(app)/classifieds/index.tsx',
  'src/app/(app)/admin/index.tsx',
  'src/app/(app)/admin/_layout.tsx',
  'src/app/(app)/voting/[poll_id]/ballot.tsx',
  'src/app/(app)/voting/[poll_id]/submit-profile.tsx',
  'src/app/(app)/voting/[poll_id]/confirmation.tsx',
  'src/app/(app)/voting/[poll_id]/candidate/[candidate_id]/qa.tsx',
  'src/app/(app)/voting/[poll_id]/candidate/[candidate_id].tsx',
  'src/app/(app)/voting/index.tsx',
  'src/app/(app)/advertisements/index.tsx',
  'src/app/(app)/invites/request.tsx',
  'src/app/(app)/invites/index.tsx',
  'src/app/(app)/events/create.tsx',
  'src/app/(app)/events/index.tsx',
  'src/app/(app)/members/index.tsx',
  'src/app/(app)/announcements/create.tsx',
  'src/app/(app)/announcements/[id].tsx',
  'src/app/(app)/announcements/index.tsx',
  'src/app/(app)/service-orders/[id].tsx',
  'src/app/(app)/service-orders/submit.tsx',
  'src/app/(app)/service-orders/index.tsx',
  'src/app/(app)/grievances/[id].tsx',
  'src/app/(app)/grievances/submit.tsx',
  'src/app/(app)/grievances/index.tsx',
  'src/app/(app)/_layout.tsx',
  'src/app/(app)/profile.tsx',
  'src/app/(app)/forum/create.tsx',
  'src/app/(app)/forum/[id].tsx',
  'src/app/(app)/forum/index.tsx',
  'src/app/(app)/q-and-a/submit.tsx',
  'src/app/(app)/q-and-a/index.tsx',
  'src/app/index.tsx',
  'src/app/(auth)/create-neighborhood.tsx',
  'src/app/(auth)/neighborhood-access.tsx',
  'src/app/(auth)/admin-sign-in.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let usedIcons = new Set();

  // Multi-line support for literals
  const iconLiteralRegex = /<MaterialIcons\s+[^>]*name=["']([^"']+)["'][^>]*\/>/gs;
  let match;
  while ((match = iconLiteralRegex.exec(content)) !== null) {
      const iconName = match[1];
      if (mapping[iconName]) {
          usedIcons.add(mapping[iconName]);
      }
  }

  const iconExprLiteralRegex = /<MaterialIcons\s+[^>]*name=\{["']([^"']+)["']\}[^>]*\/>/gs;
  while ((match = iconExprLiteralRegex.exec(content)) !== null) {
      const iconName = match[1];
      if (mapping[iconName]) {
          usedIcons.add(mapping[iconName]);
      }
  }

  // Handle ternary in name prop
  const ternaryRegex = /name=\{\s*([^?]+)\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]\s*\}/gs;
  while ((match = ternaryRegex.exec(content)) !== null) {
      const icon1 = match[2];
      const icon2 = match[3];
      if (mapping[icon1]) usedIcons.add(mapping[icon1]);
      if (mapping[icon2]) usedIcons.add(mapping[icon2]);
  }

  // Replacement step for literals (multi-line)
  content = content.replace(/<MaterialIcons\s+([^>]*?)name=["']([^"']+)["']([^>]*?)\/>/gs, (match, before, iconName, after) => {
    const lucideName = mapping[iconName];
    if (lucideName) {
      let result = `<${lucideName} ${before} ${after} strokeWidth={2} />`;
      result = result.replace(/\s+/g, ' ').replace(/\s+\/>/, ' />');
      return result;
    }
    return match;
  });

  content = content.replace(/<MaterialIcons\s+([^>]*?)name=\{["']([^"']+)["']\}([^>]*?)\/>/gs, (match, before, iconName, after) => {
    const lucideName = mapping[iconName];
    if (lucideName) {
      let result = `<${lucideName} ${before} ${after} strokeWidth={2} />`;
      result = result.replace(/\s+/g, ' ').replace(/\s+\/>/, ' />');
      return result;
    }
    return match;
  });

  // Replacement step for ternaries (multi-line)
  content = content.replace(/<MaterialIcons\s+([^>]*?)name=\{\s*([^?]+)\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]\s*\}([^>]*?)\/>/gs, (match, before, condition, icon1, icon2, after) => {
    const lucide1 = mapping[icon1];
    const lucide2 = mapping[icon2];
    if (lucide1 && lucide2) {
      let result = `{${condition} ? <${lucide1} ${before} ${after} strokeWidth={2} /> : <${lucide2} ${before} ${after} strokeWidth={2} />}`;
      result = result.replace(/\s+/g, ' ').replace(/\s+\/>/, ' />');
      return result;
    }
    return match;
  });

  // Extract existing lucide imports if any
  const lucideImportRegex = /import\s+\{(.+)\}\s+from\s+['"]lucide-react-native['"];?/g;
  const lucideMatch = lucideImportRegex.exec(content);
  if (lucideMatch) {
      lucideMatch[1].split(',').forEach(i => usedIcons.add(i.trim()));
      content = content.replace(lucideImportRegex, '');
  }

  if (usedIcons.size > 0) {
    const iconsArray = Array.from(usedIcons).filter(Boolean).sort();
    const newImport = `import { ${iconsArray.join(', ')} } from 'lucide-react-native';\n`;
    
    const materialImportRegex = /import\s+\{\s*MaterialIcons\s*\}\s+from\s+['"]@expo\/vector-icons['"];?\n?/g;
    const materialComplexImportRegex = /import\s+MaterialIcons\s+from\s+['"]@expo\/vector-icons\/MaterialIcons['"];?\n?/g;
    
    if (content.match(materialImportRegex)) {
      content = content.replace(materialImportRegex, newImport);
    } else if (content.match(materialComplexImportRegex)) {
      content = content.replace(materialComplexImportRegex, newImport);
    } else {
        // Just prepend if no material import but we have icons to import
        content = newImport + content;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
});
