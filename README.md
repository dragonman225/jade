# Jade

Jade is an experimental note-taking canvas for developing networked thought visually. I used it as a playground to explore the user experience of canvas tools for thinking and the technology of canvas interfaces.

I researched topics including but not limited to:

- Canvas-based interactions
- Rich-text on a canvas
- Plugin-first software architecture

If you want to try Jade, the easiest way is by visiting [the hosted demo](https://dragonman225.js.org/p/jade/index.html) on my website. Also you might want read the [user-facing post](https://dragonman225.js.org/jade).

Since I've moved on to a new project, [tableOS](https://tableos.substack.com/p/alpha), and am **no longer developing Jade**, I want to share the code publicly, for anyone interested to **study the technology and concepts**.

**The code is neither guaranteed to run, nor will I provide direct support.** But if you have questions about how something works or are interested in the UI design, feel free to open issues, I will consider writing posts to talk about them.

Lastly, Jade was inspired by [Muse](https://www.inkandswitch.com/muse/) and [Semilattice](https://www.semilattice.xyz/). I would like to extend my sincere thanks to them.

## Hacking

Clone this repository on your development machine and `cd` into it.

> Switch your Node.js to version 16 using [`n`](https://github.com/tj/n) or other manager. This project does not work with newer Node.js versions.

```bash
yarn
yarn web:start
```

Visit http://localhost:8140/ in your browser.

Or you can start the desktop version by (**Warning: It's likely to fail.**)

```bash
yarn
yarn electron:build
yarn electron:start
```

### Troubleshooting

- Always make sure there's only one version of each `prosemirror-*` package installed in `yarn.lock`. If there's multiple, you may get false positive type errors, and your app may crash.

## Support

If you find this project useful,

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V6EB0H0)
