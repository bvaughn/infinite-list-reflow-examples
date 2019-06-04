function createList(container, itemsCount, createItem, updateItem) {
  const indexToCachedSizeMap = new Map();
  const indexToCachedOffsetMap = new Map();
  const itemPool = new Set();
  const visibleItems = new Map();

  let listOuter = null;
  let listInner = null;

  let estimatedItemHeight = 30;
  let lastMeasuredIndex = -1;
  let totalMeasuredItemHeights = 0;
  let previousScrollTop = 0;

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

    const estimatedHeight = totalMeasuredItemHeights + estimatedUnmeasuredItemHeights;

    if (lastMeasuredIndex === itemsCount -1) {
      return Math.min(
        estimatedHeight,
        indexToCachedOffsetMap.get(lastMeasuredIndex) + indexToCachedSizeMap.get(lastMeasuredIndex)
      );
    }

    return estimatedHeight;
  }

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

  function renderItems() {
    const scrollTop = listOuter.scrollTop;
    const listHeight = listOuter.clientHeight;
    const startIndex = findItemIndexForOffset(scrollTop);

    let index = startIndex;
    let offset = indexToCachedOffsetMap.get(startIndex) || 0;
    let scrollTopAdjustments = 0;
    while (index < itemsCount && offset < scrollTop + listHeight) {
      let prevItemOffset = indexToCachedOffsetMap.has(index - 1) ? indexToCachedOffsetMap.get(index - 1) : 0;
      let prevItemSize = indexToCachedSizeMap.has(index - 1) ? indexToCachedSizeMap.get(index - 1) : 0;

      offset = prevItemOffset + prevItemSize;

      let itemSize;
      let item;

      if (visibleItems.has(index)) {
        item = visibleItems.get(index);
        item.style.setProperty('top', offset); // TODO Is this necessary?
      } else {
        if (itemPool.size > 0) {
          item = itemPool.values().next().value;

          itemPool.delete(item);
        } else {
          item = document.createElement('div');
          item.className = 'list-item';
          item.style.setProperty('width', '100%');
          item.style.setProperty('position', 'absolute');

          createItem(item);
        }

        item.style.setProperty('top', offset);

        updateItem(item, index);

        visibleItems.set(index, item);

        listInner.appendChild(item);
      }

      itemSize = item.offsetHeight;

      if (indexToCachedSizeMap.has(index)) {
        let itemSizeDelta = itemSize - indexToCachedSizeMap.get(index);

        if (itemSizeDelta !== 0) {
          totalMeasuredItemHeights += itemSizeDelta;

          // If we're scrolling up and item size has changed, note the delta.
          // We'll need to adjust scroll by this amount to preserve the appearance of smooth scrolling.
          // Else items will appear to jump around while the user scrolls.
          if (previousScrollTop > scrollTop) {
            scrollTopAdjustments += itemSizeDelta;
          }
        }
      } else {
        totalMeasuredItemHeights += itemSize;
      }

      indexToCachedSizeMap.set(index, itemSize);
      indexToCachedOffsetMap.set(index, offset);

      lastMeasuredIndex = Math.max(index, lastMeasuredIndex);
      estimatedItemHeight = Math.round(totalMeasuredItemHeights / (lastMeasuredIndex + 1));

      index++;
      offset += itemSize;
    }

    const stopIndex = index - 1;

    // Remove items that are no longer visible and return them to the pool.
    for (let [index, item] of visibleItems.entries()) {
      if (index < startIndex || index > stopIndex) {
        let item = visibleItems.get(index);
        visibleItems.delete(index);

        listInner.removeChild(item);

        itemPool.add(item);
      }
    }

    // If item sizes have changed, adjust scroll to preserve the appearance of smooth scrolling.
    if (scrollTopAdjustments !== 0) {
      // Adjusting scroll offset directly interrupts smooth scrolling for some browsers (e.g. Firefox)
      // but works well in other browsers tested (e.g. Chrome, Safari).
      // The relative scrollBy() method does not cause this interrupt for Firefox v65+
      // so if it's available, use it instead.
      // See https://bugzilla.mozilla.org/show_bug.cgi?id=1502059
      if (typeof listOuter.scrollBy === 'function') {
        listOuter.scrollBy({
          top: scrollTopAdjustments,
          left: 0,
          behavior: 'auto'
        });
      } else {
        listOuter.scrollTop = scrollTop + scrollTopAdjustments;
      }
    }

    previousScrollTop = scrollTop;

    listInner.style.setProperty('height', estimateTotalScrollHeight());
  }

  init();
  renderItems();
}
