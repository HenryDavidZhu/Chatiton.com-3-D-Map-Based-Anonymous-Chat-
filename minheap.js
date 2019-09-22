// Implement a min heap:

// -> insert, extract_min

// property: 
// - elements are in ascending order
// - complete binary tree (node is smaller than it’s children)
// - root is the most minimum
// - insert takes O(logn) time
//     - insert to the bottom right
//     - bubble up until it meets requirements
// - extract_min takes O(logn) time
//     - replace min with bottom right
//     - bubble down until it meets requirements

module.exports = function MinHeap() {
  this.data = [];

  MinHeap.prototype.insert = function (val) {
    this.data.push(val);
    this.bubbleUp(this.data.length - 1);
  };

  MinHeap.prototype.bubbleUp = function (index) {
    while (index > 0) {
      var parent = Math.floor((index + 1) / 2) - 1;

      if (this.data[parent] > this.data[index]) {
        var temp = this.data[parent];
        this.data[parent] = this.data[index];
        this.data[index] = temp;
      }

      index = parent;
    }
  };

  MinHeap.prototype.extractMin = function () {
    var min = this.data[0];
    this.data[0] = this.data.pop();
    this.bubbleDown(0);

    return min;
  };

  MinHeap.prototype.bubbleDown = function (index) {
    while (true) {
      var child = (index + 1) * 2;
      var sibling = child - 1;
      var toSwap = null;

      if (this.data[index] > this.data[child]) {
        toSwap = child;
      }

      if (this.data[index] > this.data[sibling] && (this.data[child] == null || (this.data[child] !== null && this.data[sibling] < this.data[child]))) {
        toSwap = sibling;
      }

      if (toSwap == null) {
        break;
      }

      var temp = this.data[toSwap];
      this.data[toSwap] = this.data[index];
      this.data[index] = temp;

      index = toSwap;
    }
  };
}