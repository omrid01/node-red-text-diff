# text diff
**text diff** is a custom Node-RED node, which compares text blocks (by either lines, words, characters etc.).<br>
Complete reference to the node's functionality, input arguments and output results is provided in the node's on-line help, in the Node-RED editor.

The node uses the **LCS** (Longest Common Subsequence) algorithm, to find added, changed &amp; removed text.<br>
A subsequence is a sequence derived by deleting zero or more elements without changing the order.
LCS compares original (AKA 'Old') and new text blocks (tokenized by line, word or character), and then builds a matrix of longest common subsequences, i.e. longest identical sequences which appear in both, possibly with gaps.<br>
For example (diff by word):
* Sequence A: `AB CD EF`
* Sequence B: `AB EF GH`
* LCS: `AB EF`<br>

The **text-diff** node is a server-side node, which run on the **NodeJS** engine. The installation package includes an example flow and dashboard client for testing/viewing.
