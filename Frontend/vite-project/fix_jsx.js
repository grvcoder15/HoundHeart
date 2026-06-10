const fs = require('fs');
const path = require('path');

const filepath = 'c:\\Users\\ShilkiKumari\\Desktop\\HoundHeart\\Frontend\\vite-project\\src\\Pages\\CommunityPage.jsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split(/\r?\n/);

const mostRecentIdx = lines.findIndex(line => line.includes('Most Recent'));

if (mostRecentIdx !== -1) {
    console.log(`Found 'Most Recent' at line ${mostRecentIdx + 1}`);

    let closingStartIdx = -1;
    for (let i = mostRecentIdx; i < lines.length; i++) {
        if (lines[i].includes('})()}')) {
            closingStartIdx = i + 1;
            break;
        }
    }

    if (closingStartIdx !== -1) {
        console.log(`Found closing start at line ${closingStartIdx + 1}`);

        const newClosing = [
            '                                  </div>',
            '                                </motion.div>',
            '                              )}',
            '                            </AnimatePresence>',
            '                          </div>',
            '                        </motion.div>'
        ];

        // Find where to stop
        let stopIdx = -1;
        for (let i = closingStartIdx; i < lines.length; i++) {
            if (lines[i].includes('))}') || lines[i].includes('}))')) {
                stopIdx = i;
                break;
            }
        }

        if (stopIdx !== -1) {
            console.log(`Replacing lines ${closingStartIdx + 1} to ${stopIdx}`);
            lines.splice(closingStartIdx, stopIdx - closingStartIdx, ...newClosing);
            fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
            console.log('Successfully updated CommunityPage.jsx');
        } else {
            console.log('Could not find end of post map');
        }
    } else {
        console.log('Could not find ending of condition');
    }
} else {
    console.log('Could not find Most Recent');
}
