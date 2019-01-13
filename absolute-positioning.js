function createList(container, books) {
  const indexToCachedSizeMap = new Map();
  const indexToCachedOffsetMap = new Map();
  const renderedItems = new Map();

  const booksCount = books.length;

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
    const numUnmeasuredItems = booksCount - lastMeasuredIndex - 1;
    const estimatedUnmeasuredItemHeights = numUnmeasuredItems * estimatedItemHeight;

    return totalMeasuredItemHeights + estimatedUnmeasuredItemHeights;
  }

  // TODO Adjust scroll offset by delta when scrolling backwards

  function renderBook(container, bookJSON) {
    const link = document.createElement('a');
    link.href = `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=${escape(bookJSON.title)}`
    link.text = bookJSON.title;

    const authors = document.createTextNode(` by ${bookJSON.authors.join(', ')}`);

    container.appendChild(link);
    container.appendChild(authors);

    if (bookJSON.longDescription != null) {
      const description = document.createTextNode(bookJSON.longDescription);

      container.appendChild(document.createElement('br'));
      container.appendChild(document.createElement('br'));
      container.appendChild(description);
    }
  }

  function init() {
    listOuter = document.createElement('div');
    listOuter.className = 'list-outer';

    listInner = document.createElement('div');
    listInner.className = 'list-inner';
    listInner.style.setProperty('height', booksCount * estimatedItemHeight);

    listOuter.appendChild(listInner);
    container.appendChild(listOuter);

    window.addEventListener('resize', renderItems);
    listOuter.addEventListener('scroll', renderItems);
  }

  // TODO Pool books

  function renderItems() {
    const scrollTop = listOuter.scrollTop;
    const listHeight = listOuter.clientHeight;
    const startIndex = findItemIndexForOffset(scrollTop);

    let index = startIndex;
    let offset = indexToCachedOffsetMap.get(startIndex) || 0;
    while (index < booksCount && offset < scrollTop + listHeight) {
      let prevItemOffset = indexToCachedOffsetMap.has(index - 1) ? indexToCachedOffsetMap.get(index - 1) : 0;
      let prevItemSize = indexToCachedSizeMap.has(index - 1) ? indexToCachedSizeMap.get(index - 1) : 0;

      offset = prevItemOffset + prevItemSize;

      let itemSize;
      let item;

      if (renderedItems.has(index)) {
        item = renderedItems.get(index);
        item.style.setProperty('top', offset);
      } else {
        let book = books[index];

        item = document.createElement('div');
        item.className = 'list-item';
        renderBook(item, book);
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

    // TODO Return hidden books to the pool

    listInner.style.setProperty('height', estimateTotalScrollHeight());
  }

  init();
  renderItems();
}
