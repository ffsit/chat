VGA Client-Side Chat Library
===========

This library is a simple client-side chat library that is used during VGA livestreams.

* Website: [http://videogamesawesome.com/](http://videogamesawesome.com/)

NOTES
-----------

* This library is broken into 2 layers.  The chat and the connector layer.  The chat which handles chat specific & UI Logic, while the connector logic is designed specifically as an adapter class between the chat layer and the whatever server-side chat protocol.

Required 3rd-party Libraries
-----------
The following 3rd-party libraries are required to either be installed locally with the chat library or accessible as a CDN reference.

* jQuery 2.2.X and above [https://jquery.com/] (CDN: https://code.jquery.com/jquery-2.2.4.min.js).
* Babel stand-alone library [https://babeljs.io/docs/setup/#installation] (CDN: https://unpkg.com/babel-standalone@6/babel.min.js)

Coding and Pull Request Conventions
-----------

* No tabs; use 4 spaces instead.
* Little to no trailing whitespaces if possible.
* All pull requests must be unit tested to some degree and will not fail on runtime.
* All pull requests require a detailed description and justification of the changes.

Change Log
-----------

#### 1.1.1
The following fixes have been addressed in this version:
* Fixed a logic issue during the onJoin event that would cause a JS error.

The following features have been implemented in this version:
* Adding support for hyperlinks.

#### 1.1.0
This minor version change includes major refactoring of how the entire page and resources are structured and loaded.  All content, css and images, are now placed in the content folder.  All un-minifed js files are now under the js/src folder.  Transpiled and minified files are now under the js folder.

The following fixes have been addressed in this version:
* Users running Safari on iOS devices should now be able to use the chat properly due to the transpiling.

#### 1.0.4
The following fixes have been addressed in this version:
* Join & Leave now switch windows properly.

The following features have been implemented in this version:
* The userlist is now sorted by nickname ascending.

#### 1.0.3
The following fixes (refactoring) have been implemented in this version:
* Fixed the gap between the username and message in Firefox.
* Fixed the nickname issue with users that have a number as the first character in their nickname.
* Removed the support button for now.

The following features have been implemented in this version:
* Added additional help information.
* Added an option to enable debugging via the URL, more user friendly.

#### 1.0.2
The following fixes and new features have been implemented in this version:
* Fixed the broken emote command and some minor refactoring.
* Completed the incomplete logic for private message handling.

#### 1.0.1
Fixed the following issues:
* The message 'The room is now in TURBO only mode.' spammed the chat whenever a user logged in.
* The userlist became corrupted and user messages were lost when the user count was greater than 20.
* Messages were being repeated due to the above condition and the chatbox not being cleared due to a latency issue.

#### 1.0.0
Official release.

#### 0.1.0
Pre-initial release.
