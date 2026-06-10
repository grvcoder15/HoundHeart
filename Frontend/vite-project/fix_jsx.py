import os

filepath = r"c:\Users\ShilkiKumari\Desktop\HoundHeart\Frontend\vite-project\src\Pages\CommunityPage.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We look for the marker of the engagement section end which is unique
# Line 1015: "                            </div>\n"
# Line 1016: "\n"
# Line 1017: "                            <AnimatePresence>\n"

# But to be safer, let's find the indices of the known problematic lines.
# We know line 1258 is "                                 </AnimatePresence>\n"
# And it should be closing line 1017.

# Rebuilding the block from 1017 onwards for the post container
# Actually, let's just find the line with "Most Recent" and work backwards/forwards.

most_recent_idx = -1
for i, line in enumerate(lines):
    if "Most Recent" in line:
        most_recent_idx = i
        break

if most_recent_idx != -1:
    print(f"Found 'Most Recent' at line {most_recent_idx + 1}")
    
    # Let's find the closing of this AnimatePresence block.
    # It should be after line 1256 which is " })()} "
    
    closing_start_idx = -1
    for i in range(most_recent_idx, len(lines)):
        if "})()}" in lines[i]:
            closing_start_idx = i + 1
            break
            
    if closing_start_idx != -1:
        print(f"Found closing start at line {closing_start_idx + 1}")
        
        # We replace from closing_start_idx to the end of the post container close.
        # Original:
        # lines[closing_start_idx] = "                                  </div>\n"
        # lines[closing_start_idx+1] = "                                </AnimatePresence>\n"
        # lines[closing_start_idx+2] = "                            </div>\n"
        # lines[closing_start_idx+3] = "                        </motion.div>\n"
        
        # New structure needed:
        new_closing = [
            '                                  </div>\n',
            '                                </motion.div>\n',
            '                              )}\n',
            '                            </AnimatePresence>\n',
            '                          </div>\n',
            '                        </motion.div>\n'
        ]
        
        # Find where to stop replacing (the map closing ))})
        stop_idx = -1
        for i in range(closing_start_idx, len(lines)):
            if "))}" in lines[i] or "}))" in lines[i]:
                stop_idx = i
                break
        
        if stop_idx != -1:
            print(f"Replacing lines {closing_start_idx + 1} to {stop_idx}")
            lines[closing_start_idx:stop_idx] = new_closing
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            print("Successfully updated CommunityPage.jsx")
        else:
            print("Could not find end of post map")
else:
    print("Could not find 'Most Recent'")
