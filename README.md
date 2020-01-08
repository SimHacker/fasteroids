# Fasteroids

Fasteroids Space Rock Lava Lamp Shoot-Em-Up Game, by Don Hopkins.

Originally written in
[JScript](https://en.wikipedia.org/wiki/JScript)
for Internet Explorer using
[VML](https://en.wikipedia.org/wiki/Vector_Markup_Language)
(Vector Markup Language) graphics in 2001. (See
"notes/fasteroids-vml.js".)

Then ported to JavaScript for the
[Adobe SVG Viewer](https://www.adobe.com/devnet/svg/adobe-svg-viewer-download-area.html)
web browser plug-in in 2003. (See "notes/fasteroids-svg.js".)

Later translated to
[OpenLaszlo](https://en.wikipedia.org/wiki/OpenLaszlo)
JavaScript/XML running in the
[Flash](https://en.wikipedia.org/wiki/Adobe_Flash)
player in 2005. (See "notes/fasteroids-laszlo.lzx" and
"notes/dynamics.lzx".)

Now translated to
[TypeScript](https://www.typescriptlang.org/)
in 2020, and playing in a web browser near you, courtesy of the
[Svelt](https://svelte.dev/)
cybernetically enhanced web app un-framework. (See
"src/fasteroids.ts".)

Adapted from
[Chris Hecker's](https://en.wikipedia.org/wiki/Chris_Hecker#Articles)
1996-1997 Game Developer Magazine
[series of articles on 2D Rigid Body Dynamics](http://www.chrishecker.com/Rigid_Body_Dynamics):

## [Physics, Part 1: The Next Frontier - Oct/Nov 96](http://www.chrishecker.com/images/d/df/Gdmphys1.pdf)

This is the introduction to the physics series. It covers the linear
parts of 2D rigid body mechanics, and a little bit of numerical
integration.

## [Physics, Part 2: Angular Effects - Dec/Jan 96](http://www.chrishecker.com/images/c/c2/Gdmphys2.pdf)

This article covers 2D angular rigid body mechanics and the overall 2D
dynamics algorithm.

## [Physics, Part 3: Collision Response - Feb/Mar 97](http://www.chrishecker.com/images/e/e7/Gdmphys3.pdf)

We finish off 2D physics with collision response, including the
angular effects induced by a collision. The 2D physics sample,
discussed below, demonstrates all the concepts learned so far.

## [Physics, Part 4: The Third Dimension - June 97](http://www.chrishecker.com/images/b/bb/Gdmphys4.pdf)

The final article in the series. To pack in all the 3D equivalents of
the first three articles, I created this monster of an article. It
comes in at twice the length of the others, with 6000 words and 20
equations.

## [Chris Hecker's Physics References](http://www.chrishecker.com/Physics_References)

An Annotated Bibliography for Rigid Body Dynamics. Originally
Presented at the 1997 Computer Game Developer's Conference.

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
