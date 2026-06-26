const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'Pages');
const files = [
  'AskExpertPage.jsx',
  'BondAnalyticsPage.jsx',
  'ChakraRitualsPage.jsx',
  'CommunityPage.jsx',
  'CoursesPage.jsx',
  'DashboardPage.jsx',
  'GriefSupportPage.jsx',
  'JournalPage.jsx',
  'LegacyProjectPage.jsx',
  'OnlineStorePage.jsx',
  'SacredGuidePage.jsx',
  'SacredGuideReaderPage.jsx',
  'WearableIntegrationPage.jsx'
];

files.forEach(f => {
  const fp = path.join(pagesDir, f);
  if (!fs.existsSync(fp)) {
    console.log('Not found:', f);
    return;
  }
  let c = fs.readFileSync(fp, 'utf8');

  // Remove import lines for Navbar
  c = c.replace(/import Navbar from ['"][^'"]*Navbar['"];\r?\n/g, '');

  // Remove self-closing <Navbar ... /> JSX lines
  c = c.replace(/[ \t]*<Navbar[^>]*\/>\r?\n/g, '');

  fs.writeFileSync(fp, c, 'utf8');
  console.log('Cleaned:', f);
});

console.log('Done!');
