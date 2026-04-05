const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('d:/arachnie_work/updated_work/data/visa-category/ir-1.json', 'utf8'));

function getActiveStepsForStage(data, stageIdx, filingMethod) {
  const stage = data.stages[stageIdx];
  if (!stage) return [];
  
  const method = filingMethod || 'online';
  return stage.steps.filter(step => {
    if (!step.branch || step.branch === 'both') return true;
    return step.branch === method;
  });
}

function getStageProgress(data, stageIdx, state) {
  const activeSteps = getActiveStepsForStage(data, stageIdx, state.metadata.filingMethod);
  if (activeSteps.length === 0) return { done: 0, total: 0, pct: 0 };
  
  const done = activeSteps.filter(s => state.completedSteps.has(s.id)).length;
  return {
    done,
    total: activeSteps.length,
    pct: Math.round((done / activeSteps.length) * 100)
  };
}

const dummyState = {
  metadata: { filingMethod: 'online' },
  completedSteps: new Set()
};

console.log('Stage 1:', getStageProgress(data, 0, dummyState));
console.log('Stage 2:', getStageProgress(data, 1, dummyState));
console.log('Stage 3:', getStageProgress(data, 2, dummyState));
console.log('Stage 4:', getStageProgress(data, 3, dummyState));
console.log('Stage 5:', getStageProgress(data, 4, dummyState));
