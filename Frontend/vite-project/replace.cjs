const fs = require('fs');
const files = [
  'AskExpertPage.jsx', 'ChakraRitualsPage.jsx', 'CommunityPage.jsx', 
  'DashboardPage.jsx', 'JournalPage.jsx', 'ProfileSettingsPage.jsx', 
  'SacredGuidePage.jsx', 'SacredGuideReaderPage.jsx', 'DashboardPage_BACKUP_SYNC.jsx'
];
files.forEach(f => {
  const p = 'c:/Shuvina/Hound Heart/Hound_Heart_API/Frontend/vite-project/src/Pages/' + f;
  if (!fs.existsSync(p)) return;
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/setShowPricingModal\(true\)/g, "navigate('/subscription')");
  fs.writeFileSync(p, text);
  console.log('Updated ' + f);
});
