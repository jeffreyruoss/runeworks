# TODO

## Remember / review

docs/game-design-v2.md

## CURRENT

Don't have the top and bottom bars overlap the game world - have that be the bounds.

## NEXT

Maybe the faster you build the more of a benefit you get? Multi-player competition or reward bonuses? Or it could just be a mode?

Let's take a looks through the Phaser docs and see if there are any features we could use for our game to improve what is already there or add new features.

Add shift + esdf: Move 4 paces to the default bottom menu and build bottom menu.

Just try roads and wagons. It might not be that bad to place roads with the keyboard. It might be better than the way factorio does it. If it sucks, we can remove it.

Maybe make basic buildings 1 tile?

If there are too many buildings we can do basic and advanced (or some other categorization). If there are 2 categories, we can have a toggle to switch.

In development settings, add a button that adds 10000 of each resource to make testing easier. And add a button that clears all resources.

Game design and balance config: I was thinking what if we created a simple app outside of the game that we could use to visualize all the components of the game for design purposes and to make editing and balancing the game values as easy as possible (buildings, items, costs, times, etc). Then we could run a script to export the config to json? Or this app could just write to a database that the game reads? Or something better? Is there a Phaser way? I want to do something that keeps the game itself very performant by keeping the game and tools separate. Let's discuss options.

Manual tile map editor? (tool that runs outside of the game code)
But also have some procedural generations and AI mapping?
Procedural randomizing could be in the UI?
Could have more tools like that too

Sandbox mode. Currently all buildings are unlocked? Let's still make it so that you have to unlock stuff.

## Group of changes

fade in the main game scene from black.

Flush out the inventory modal. Use images for the items.

Replace the generic loading bar that is before the title screen with the same loading bar that we have after the title screen.

## Gemini API for images

- [ ] Is the API key in a good, safe place (not in dist where it will be live)?
- [ ] Code review on new image related stuff

## Code review, cleanup, tests

Tests last updated mar 8

## Tutorial

## After MVP
