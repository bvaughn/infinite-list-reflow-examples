function createList(container, items) {
  const indexToCachedSizeMap = new Map();
  const indexToCachedOffsetMap = new Map();
  const renderedItems = new Map();

  const itemsCount = items.length;

  let listOuter = null;
  let listInner = null;

  let estimatedItemHeight = 30;
  let lastMeasuredIndex = -1;
  let totalMeasuredItemHeights = 0;

  function findItemIndexForOffset(offset) {
    // If we've already positioned and measured past this point,
    // Use a binary search to find the closest item.
    if (offset <= totalMeasuredItemHeights) {
      return findNearestItemBinarySearch(lastMeasuredIndex, 0, offset);
    }

    // Otherwise start rendering where we left off.
    return lastMeasuredIndex + 1;
  }

  function findNearestItemBinarySearch(indexHigh, indexLow, targetOffset) {
    while (indexLow <= indexHigh) {
      const indexMiddle = indexLow + Math.floor((indexHigh - indexLow) / 2);
      const itemOffset = indexToCachedOffsetMap.get(indexMiddle);

      if (itemOffset === targetOffset) {
        return indexMiddle;
      } else if (itemOffset < targetOffset) {
        indexLow = indexMiddle + 1;
      } else if (itemOffset > targetOffset) {
        indexHigh = indexMiddle - 1;
      }
    }

    if (indexLow > 0) {
      return indexLow - 1;
    } else {
      return 0;
    }
  };

  function estimateTotalScrollHeight() {
    const numUnmeasuredItems = itemsCount - lastMeasuredIndex - 1;
    const estimatedUnmeasuredItemHeights = numUnmeasuredItems * estimatedItemHeight;

    return totalMeasuredItemHeights + estimatedUnmeasuredItemHeights;
  }

  // TODO Adjust scroll offset by delta when scrolling backwards

  function init() {
    listOuter = document.createElement('div');
    listOuter.className = 'list-outer';

    listInner = document.createElement('div');
    listInner.className = 'list-inner';
    listInner.style.setProperty('height', itemsCount * estimatedItemHeight);

    listOuter.appendChild(listInner);
    container.appendChild(listOuter);

    window.addEventListener('resize', renderItems);
    listOuter.addEventListener('scroll', renderItems);
  }

  // TODO Pool items

  function renderItems() {
    const scrollTop = listOuter.scrollTop;
    const listHeight = listOuter.clientHeight;
    const startIndex = findItemIndexForOffset(scrollTop);

    let index = startIndex;
    let offset = indexToCachedOffsetMap.get(startIndex) || 0;
    while (index < itemsCount && offset < scrollTop + listHeight) {
      let prevItemOffset = indexToCachedOffsetMap.has(index - 1) ? indexToCachedOffsetMap.get(index - 1) : 0;
      let prevItemSize = indexToCachedSizeMap.has(index - 1) ? indexToCachedSizeMap.get(index - 1) : 0;

      offset = prevItemOffset + prevItemSize;

      let itemSize;
      let item;

      if (renderedItems.has(index)) {
        item = renderedItems.get(index);
        item.style.setProperty('top', offset);
      } else {

        item = document.createElement('div');
        item.className = 'list-item';
        item.innerText = `${index}: ${items[index]}`;
        item.style.setProperty('width', '100%');
        item.style.setProperty('position', 'absolute');
        item.style.setProperty('top', offset);

        renderedItems.set(index, item);

        listInner.appendChild(item);
      }

      itemSize = item.offsetHeight;

      if (indexToCachedSizeMap.has(index)) {
        totalMeasuredItemHeights += itemSize - indexToCachedSizeMap.get(index);
      } else {
        totalMeasuredItemHeights += itemSize;
      }

      indexToCachedSizeMap.set(index, itemSize);
      indexToCachedOffsetMap.set(index, offset);

      lastMeasuredIndex = Math.max(index, lastMeasuredIndex);

      index++;
      offset += itemSize;
    }

    const stopIndex = index - 1;

    for (let [index, item] of renderedItems.entries()) {
      if (index < startIndex || index > stopIndex) {
        let item = renderedItems.get(index);
        renderedItems.delete(index);
        listInner.removeChild(item);
      }
    }

    // TODO Return hidden items to the pool

    listInner.style.setProperty('height', estimateTotalScrollHeight());
  }

  init();
  renderItems();
}
