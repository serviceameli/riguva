(() => {
  'use strict';

  function groupLetters(entries) {
    const groups = [];
    for (const entry of entries) {
      const letter = entry.name.normalize('NFC')[0].toLocaleUpperCase('ru');
      if (groups.at(-1)?.[0] !== letter) groups.push([letter, []]);
      groups.at(-1)[1].push(entry);
    }
    return groups;
  }

  function paginate(entries, {maxHeight, measure}) {
    if (!entries.length) return [{left: [], right: []}];
    const leaves = [];
    let offset = 0;

    while (offset < entries.length) {
      const side = leaves.length % 2 ? 'right' : 'left';
      const budget = typeof maxHeight === 'number' ? maxHeight : maxHeight[side];
      // The measured list grows as complete rows are added. Find the longest
      // prefix that fits this leaf, including any repeated letter heading.
      let first = offset + 1;
      let last = entries.length;
      let end = first;

      while (first <= last) {
        const middle = Math.floor((first + last) / 2);
        const groups = groupLetters(entries.slice(offset, middle));
        if (measure(groups, side) <= budget) {
          end = middle;
          first = middle + 1;
        } else {
          last = middle - 1;
        }
      }

      leaves.push(groupLetters(entries.slice(offset, end)));
      offset = end;
    }

    const spreads = [];
    for (let i = 0; i < leaves.length; i += 2) {
      spreads.push({left: leaves[i], right: leaves[i + 1] ?? []});
    }
    return spreads;
  }

  window.HarstokPagination = {groupLetters, paginate};
})();
