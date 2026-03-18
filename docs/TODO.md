# TODO

## Gemini API for images

- [ ] Is the API key in a good, safe place (not in dist where it will be live)?
- [ ] Code review on new image related stuff

## CURRENT

## NEXT

SEE docs/game-design-v2.md

Jeff note: make the fonts and UI as small as possible while still being readable on my macbook air.
Let's make all of the game scene fonts one increment smaller.

Maybe make the basic buildings 1 tile sized not 4?

In development settings, add a button that adds 10000 of each resource to make testing easier. And add a button that clears all resources.

Game design and balance config: I was thinking what if we created a simple app outside of the game that we could use to visualize all the components of the game for design purposes and to make editing and balancing the game values as easy as possible (buildings, items, costs, times, etc). Then we could run a script to export the config to json? Or this app could just write to a database that the game reads? Or something better? Is there a Phaser way? I want to do something that keeps the game itself very performant by keeping the game and tools separate. Let's discuss options.

fade in the main game scene from black.

Build mode ideas:
Right now when you place, it is ready to place another building of that type. instead, maybe we press something to toggle multi-place mode? (have it in the tutorial).
Also, maybe instead of a modal, have the buildings in a bar about the main bar (use categories that you drill down into so they all fit)?

Manual tile map editor? (tool that runs outside of the game code)
But also have some procedural generations and AI mapping?
Procedural randomizing could be in the UI?
Could have more tools like that too

Sandbox mode. Currently all buildings are unlocked? Let's still make it so that you have to unlock stuff.

## Code review, cleanup, tests

Tests last updated mar 8

## Tutorial

## After MVP
