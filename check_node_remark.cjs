// 检查数据集中 node_remark 的分布情况
const fs = require('fs');
const path = require('path');

const datasetDir = path.join(__dirname, 'dataset');

if (!fs.existsSync(datasetDir)) {
  console.log('Dataset directory not found:', datasetDir);
  process.exit(1);
}

const files = fs.readdirSync(datasetDir).filter(f => f.endsWith('.jsonl'));

console.log(`Found ${files.length} dataset files\n`);

for (const file of files) {
  const filePath = path.join(datasetDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim());

  let totalTurns = 0;
  let turnsWithNodeRemark = 0;
  let emptyNodeRemarks = 0;
  let sampleNodeRemarks = [];

  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      if (data.dialog && Array.isArray(data.dialog)) {
        for (const turn of data.dialog) {
          if (turn.role === 'assistant') {
            totalTurns++;
            if (turn.node_remark !== undefined) {
              turnsWithNodeRemark++;
              if (turn.node_remark === '' || turn.node_remark === null) {
                emptyNodeRemarks++;
              } else {
                if (sampleNodeRemarks.length < 3) {
                  sampleNodeRemarks.push({
                    id: data.id,
                    turn: turn.turn_index,
                    remark: turn.node_remark.slice(0, 100)
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  console.log(`📁 ${file}:`);
  console.log(`   Total assistant turns: ${totalTurns}`);
  console.log(`   Turns with node_remark field: ${turnsWithNodeRemark}`);
  console.log(`   Empty node_remarks: ${emptyNodeRemarks}`);
  console.log(`   Non-empty node_remarks: ${turnsWithNodeRemark - emptyNodeRemarks}`);

  if (sampleNodeRemarks.length > 0) {
    console.log(`   Sample node_remarks:`);
    sampleNodeRemarks.forEach(s => {
      console.log(`     - ${s.id} T${s.turn}: "${s.remark}"`);
    });
  } else if (turnsWithNodeRemark === 0) {
    console.log(`   ⚠️  No node_remark field found in any turn!`);
  } else {
    console.log(`   All node_remarks are empty`);
  }
  console.log('');
}
