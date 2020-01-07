# Fasteroids

Fasteroids Space Rock Lava Lamp Shoot-Em-Up Game, by Don Hopkins.

Originally written in JScript for Internet Explorer with VML graphics
in 2001. (See "notes/fasteroids-vml.js".)

Then ported to JavaScript for the Adobe SVG web browser plug-in in
2003. (See "notes/fasteroids-svg.js".)

Later translated to OpenLaszlo JavaScript/XML on the Flash player.
(See "notes/fasteroids-laszlo.lzx" and "notes/dynamics.lzx".)

Now translated to TypeScript and playing in a web browser near you,
courtesy of Svelt. (See "src/fasteroids.ts".)

Adapted from Chris Hecker's 1996-1997 Game Developer Magazine articles
on 2D Rigid Body Dynamics:

https://web.archive.org/web/20040615081248/http://www.d6.com/users/checker/dynamics.htm

## [Physics, Part 1: The Next Frontier - Oct/Nov 96](https://web.archive.org/web/20040615081248/http://www.d6.com/users/checker/pdfs/gdmphys1.pdf)

This is the introduction to the physics series. It covers the linear
parts of 2D rigid body mechanics, and a little bit of numerical
integration.

## [Physics, Part 2: Angular Effects - Dec/Jan 96](https://web.archive.org/web/20040615081248/http://www.d6.com/users/checker/pdfs/gdmphys2.pdf)

This article covers 2D angular rigid body mechanics and the overall 2D
dynamics algorithm.

## [Physics, Part 3: Collision Response - Feb/Mar 97](https://web.archive.org/web/20040615081248/http://www.d6.com/users/checker/pdfs/gdmphys3.pdf)

We finish off 2D physics with collision response, including the
angular effects induced by a collision. The 2D physics sample,
discussed below, demonstrates all the concepts learned so far.

## [Physics, Part 4: The Third Dimension - June 97](https://web.archive.org/web/20040615081248/http://www.d6.com/users/checker/pdfs/gdmphys4.pdf)

The final article in the series. To pack in all the 3D equivalents of
the first three articles, I created this monster of an article. It
comes in at twice the length of the others, with 6000 words and 20
equations.

## Get started

Install the dependencies...

```bash
cd fasteroids
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see
fasteroids running. Edit a component file in `src`, save it, and
reload the page to see your changes.

## Deploying to the web

### With [now](https://zeit.co/now)

Install `now` if you haven't already:

```bash
npm install -g now
```

Then, from within your project folder:

```bash
now
```

As an alternative, use the
[Now desktop client](https://zeit.co/download)
and simply drag the unzipped project folder to the taskbar icon.

### With [surge](https://surge.sh/)

Install `surge` if you haven't already:

```bash
npm install -g surge
```

Then, from within your project folder:

```bash
npm run build
surge public
```
