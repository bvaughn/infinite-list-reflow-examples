This demo can be viewed at [infinite-list-reflow-examples.now.sh](https://infinite-list-reflow-examples.now.sh/).

# Infinite lists and reflow

In my experience, infinite lists use two basic layout strategies. The first uses absolute positioning to control where visible items are rendered. The second uses relative positioning (with top/left padding to offset for unrendered items).

In both cases, the list abstraction caches some metadata about the size of items once they have been rendered– so that it knows where to position the items that come after them.

Both of these strategies need to handle reflow. For example, changing the width of a list often affects the height of its itesm. Generally speaking, only the "window" of rendered (visible) items are remeasured in this case (because it would be too slow to rerender and remeasure all of the items before). But once a user scrolls backwards (up/left)– the list needs to account for the reflowed sizes. If it didn't, items would appear to jump up or down (depending on the delta between the previous, cached sizes and the new/reflowed sizes).

How the list deals with new sizes depends on which of the two layout strategies it uses.

In the first case (absolute positioning) the list can make small adjustments to the scroll offset to account for the size differences. Since each adjustment typically only takes a small number of items into account, it's not too noticeable. Eventually if a user scrolls all the way back to the first item in the list, it will align with scroll offset 0. Unfortunately in some browsers<sup>1</sup>, adjusting scroll offset will interrupt momentum scrolling– resulting in a very jerky scrolling experience.

The second strategy (relative positing) does not need to adjust scroll offset, and so it does not have the problem of interrupting momentum scrolling. It uses a similar technique but adjusts the top/left padding to preserve the appearance of smooth scrolling. The downside of this approach is that item 0 may not line up with scroll offset 0. In the event that item size decreases, the list can handle this by doing a final adustment to set padding to 0 when the first item is scrolled back into view. (This would cause the scrolling to jump a little but it's not that bad of a user experience.) However in the event that item size increases, the list will run out of padding (since padding cannot go negative) and scroll offset 0 will be reached when there are still more items to render. (This is a very bad user experience.)

<sup>1 - The currently implemented technique works well for the latest versions of Chrome (desktop + Android), Safari (desktop + iOS), Edge, and IE.</sup>

## Demos

### Strategy 1: Absolute positioning

I've put together a small demo that shows the absolute positioning strategy.

To see what I described above– scroll down for a bit, resize the browser width, and then scroll back up. In particular, watch the scrollbar while you're scrolling. You may notice the track thumb jump around a little as new items are rendered. (The more drastic the resize, the more it may jump.)

If you do this in Chrome, the  scrolling experience will be smooth. If you do this with Firefox though, scrolling will be interrupted ([although this will soon be changing](https://github.com/bvaughn/react-window/blob/issues/6/src/DynamicSizeList.js#L330-L345)).

* repro: [infinite-list-reflow-examples.now.sh](https://infinite-list-reflow-examples.now.sh/list-absolute-positioning.html)
* source: [GitHub.com/bvaughn/infinite-list-reflow-examples](https://github.com/bvaughn/infinite-list-reflow-examples/blob/master/list-absolute-positioning.js)

### Strategy 2: Relative positioning

This demo shows an infinite list built using relative positioning. It does not currently handle reflow, meaning that if you scroll backwards after resizing the list– items will jump around. (I plan to finish this implementation soon.)

* repro: [infinite-list-reflow-examples.now.sh](https://infinite-list-reflow-examples.now.sh/list-relative-positioning.html)
* source: [GitHub.com/bvaughn/infinite-list-reflow-examples](https://github.com/bvaughn/infinite-list-reflow-examples/blob/master/list-relative-positioning.js)

# Instructions

To run these demos locally:
```sh
npm install
npm run start
```