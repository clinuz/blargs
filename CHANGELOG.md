##### 0.2.0
- Add symbol to return value for determining if an array is actually a product of a parse job
- Fix a bug when multi-depth subargs had square brackets stacked together, e.g. ']]]'
- blargs() will check to see if the array passed in is the result of another parse and return the original object if it is