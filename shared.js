function createItems() {
  const items = [];
  for (let i = 0; i < 1000; i++) {
    let item = [];
    let numWords = 1 + Math.round(Math.random() * 99);
    for (let j = 0; j < numWords; j++) {
      let numLetters = 1 + Math.round(Math.random() * 9);
      item.push('X'.repeat(numLetters));
    }
    items.push(item.join(' '));
  }

  return items;
}