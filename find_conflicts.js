const fs = require("fs");
const content = fs.readFileSync(
  "c:/Users/HP/Desktop/arachnie/Arachnie/app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/StepView.tsx",
  "utf-8"
);
const lines = content.split("\n");
let conflictStarted = false;
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("<<<<<<<")) {
    conflictStarted = true;
    startLine = i + 1;
  }
  if (lines[i].startsWith(">>>>>>>")) {
    console.log(`Conflict from line ${startLine} to ${i + 1}`);
    conflictStarted = false;
  }
}
