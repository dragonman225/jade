# Add Inline Styles to Text with Markdown Syntaxes in ProseMirror

In [ProseMirror](https://prosemirror.net/), you can write [_inputrules_](https://prosemirror.net/docs/ref/#inputrules), which let you trigger certain actions when a given pattern of text is typed in the editor and matched by a [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions).

There are already many examples of [_inputrules_](https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.js) that let you create different types of block nodes in [`prosemirror-example-setup`](https://github.com/ProseMirror/prosemirror-example-setup). So, in this article, we talk about creating inline styles like \*\***bold**\*\* and \*_italic_\*.

## Explanation

### Naive

To match \*\*bold\*\*, you write:

```
/**(.+)**$/
```

But this does not work if you also need to match \*italic\*, let's say, with:

```
/*(.+)*$/
```

Why? Because when you type \*\*bold\*, it triggers the match of `/*(.+)*$/`, so the text becomes \*_bold_. You have no chance of typing the final \*.

However, if there're no overlapping cases, like \`code\`, this naive version works fine.

### Robust

To match \*\*bold\*\*, you write:

```
/(?<=[^*\n]|^)\*\*([^*\n]+)\*\*$/
```

The first part `(?<=[^*\n]|^)` uses a _Positive Lookbehind_ operator `(?<=...)`. It tells the regex engine to match something, but not to add it to the match (or you can say not to consume it). `[^*\n]` says to match a character that is not `*` or `\n`. `|^` says to also match the beginning of a line.

The second part is trivial. `\*\*` matches two \*s, to find the first two characters of \*\*bold\*\*. `\` escapes `*` to treat it as a character.

We can now go back to the first part. The reason of the first part is to ensure that there're no \*s before \*\* that we want to match, so we can match **exactly** two \*s. If there're three, we don't match, so other rules that match three works.

The third part `([^*\n]+)` is to capture the text between the pair of \*\*. `+` says that it'll match one or more characters. `[^*\n]` excludes `*`, since `*` would suggest the end of the pair, and `\n`, since we're matching **inline** styles, so no newline!

The final part `\*\*$` ensures the end of the pair.

In conclusion, there're four parts in this regex structure — **Guard** + **Match Start** + **Text** + **Ensure End**. Now we can write more regexes based on this structure.

## Examples & Test Cases

- Remember to turn on `/gm` (global, multiline) for your regex engine.

### Bold and Italic with Triple Stars

Regex:

```
/(?<=[^*\n]|^)\*\*\*([^*\n]+)\*\*\*$/
```

Match:

```
***123***
5***123***
***1***
```

No match:

```
****123***
***123**
**123***
***123
```

### Bold with Double Stars

Regex:

```
/(?<=[^*\n]|^)\*\*([^*\n]+)\*\*$/
```

Match:

```
**123**
5**123**
**1**
```

No match:

```
***123**
**123*
*123**
**123
```

### Bold with Double Underscores

Regex:

```
/(?<=[^_\n]|^)__([^_\n]+)__$/
```

Match:

```
__123__
5__123__
__1__
```

No match:

```
____
__123_
_123_
__123
```

### Italic with Single Star

Regex:

```
/(?<=[^*\n]|^)\*([^*\n]+)\*$/
```

Match:

```
*123*
5*123*
*1*
```

No Match:

```
**123**
**123*
*123**
*123
```

### Italic with Single Underscore

Regex:

```
/(?<=[^_\n]|^)_([^_\n]+)_$/
```

Match:

```
_123_
5_123_
_1_
```

No match:

```
__
__123_
__123__
_123
```
