export function generateMockData(count: number) {
  const data = [];
  const models = ['model_a', 'model_b', 'model_c'];
  const modelNames = ['GPT-4', 'Claude-3', 'Llama-3'];
  const testpoints = ['Math', 'Coding', 'Reasoning', 'Creative Writing'];
  const languages = ['en', 'zh', 'es'];

  for (let i = 0; i < count; i++) {
    const row: any = {
      id: `sess_${i}_turn_1`,
      session_id: `sess_${i}`,
      turn: 1,
      language: languages[Math.floor(Math.random() * languages.length)],
      testpoint: testpoints[Math.floor(Math.random() * testpoints.length)],
      indicator: 'accuracy',
      full_conversation: JSON.stringify([
        { role: 'user', content: `This is a test prompt for session ${i}.\n\nPlease solve the following problem:\n\nIf I have 3 apples and eat 1, how many are left?` }
      ]),
      conv_metadata: JSON.stringify({ source: 'synthetic' })
    };

    models.forEach((model, index) => {
      const suffix = model.split('_')[1];
      row[model] = modelNames[index];
      
      let responseText = '';
      if (index === 0) {
        responseText = `Response from ${modelNames[index]} for session ${i}.\n\nYou have 2 apples left.`;
      } else if (index === 1) {
        responseText = `Based on the calculation, 3 - 1 = 2. You have 2 apples left.`;
      } else {
        responseText = `I think it is 2 apples. This is a longer text to demonstrate line clamping and truncation in the UI. It should be cut off after a few lines. Let's add some more text to make it really long. The quick brown fox jumps over the lazy dog.`;
      }
      
      row[`conversation_${suffix}`] = responseText;
      row[`accuracy_${suffix}`] = Math.random() > 0.3 ? 1 : 0;
      row[`score_${suffix}`] = (Math.random() * 10).toFixed(1);
    });

    data.push(row);
  }
  return data;
}
