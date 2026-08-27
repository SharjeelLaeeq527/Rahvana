// /**
//  * Deletion Guard Hook
//  * Blocks Edit/Write tool calls that remove a large amount of code without explanation.
//  * Exit 2 = block the tool and show the message to Claude.
//  */

// const fs = require('fs');

// const EDIT_REMOVAL_THRESHOLD = 15;   // lines
// const WRITE_REMOVAL_THRESHOLD = 20;  // lines

// let raw = '';
// process.stdin.on('data', chunk => (raw += chunk));
// process.stdin.on('end', () => {
//   try {
//     const { tool_name, tool_input } = JSON.parse(raw);

//     if (tool_name === 'Edit') {
//       const oldLines = (tool_input.old_string || '').split('\n').length;
//       const newLines = (tool_input.new_string || '').split('\n').length;
//       const removed = oldLines - newLines;

//       if (removed >= EDIT_REMOVAL_THRESHOLD) {
//         console.error(
//           `DELETION GUARD (Edit): This change removes ${removed} lines from ${tool_input.file_path}.\n` +
//           `Before proceeding, explicitly state:\n` +
//           `  1. What code is being removed\n` +
//           `  2. Why it is safe to remove (not needed, refactored elsewhere, etc.)\n` +
//           `If the removal is intentional, break it into a smaller targeted edit or confirm with the user first.`
//         );
//         process.exit(2);
//       }
//     }

//     if (tool_name === 'Write') {
//       const filePath = tool_input.file_path;
//       if (fs.existsSync(filePath)) {
//         const existing = fs.readFileSync(filePath, 'utf8');
//         const existingLines = existing.split('\n').length;
//         const newLines = (tool_input.content || '').split('\n').length;
//         const removed = existingLines - newLines;

//         if (removed >= WRITE_REMOVAL_THRESHOLD) {
//           console.error(
//             `DELETION GUARD (Write): This overwrites ${filePath} and removes ${removed} lines.\n` +
//             `Before proceeding, explicitly state:\n` +
//             `  1. What sections are being removed\n` +
//             `  2. Why this is a full rewrite instead of a targeted Edit\n` +
//             `Prefer Edit over Write to avoid accidental code loss.`
//           );
//           process.exit(2);
//         }
//       }
//     }

//     process.exit(0);
//   } catch (_) {
//     // Never block on parse error — let the tool proceed
//     process.exit(0);
//   }
// });
