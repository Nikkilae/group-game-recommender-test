# Game recommender (test version)

A web application for recommending video games from [Steam](http://store.steampowered.com/) for groups of Steam users.

This version of the application has been adapted for experimental evaluation and testing. Thus you may find some features on the server side code that aren't fully exposed in the front end of this customized version. Likewise, some UI features exist only for testing purposes.

## Setup

### Node

The server runs on [Node.js](https://nodejs.org), which you'll need to have installed on the server and/or development environment.

### Steam Web API

The application makes use of the [Steam Web API](https://steamcommunity.com/dev). An API key can be acquired from https://steamcommunity.com/dev/apikey. Enter your API key to /server/steamApiConfig.js. An example of the correct file format can be found in /server/steamApiConfig.example.js.

### Data

This repository doesn't include a dataset of games, but one is required for it to work. To use the same dataset that was used in experimental evaluation, download the data [here](https://drive.google.com/open?id=11B_BevUXbgJawrHXFk-I3ezpwEtDo0i0) (~50MB) and place the downloaded and unzipped steamData directory into the /server directory. In the end, you should have a directory /server/steamData/games that contains json files and a file /server/steamData/tagData.json.

### Building for production

First run ```npm run-script build``` to install and build everything. Then run ```npm run-script start``` to start the server. Alternatively, use the hybrid command that does both of the above: ```npm run-script build-start```.

### For development

First install dependencies with ```npm install``` at the root directory. Then navigate to the /server directory and ```npm install``` again. Now run ```npm start``` to start the server.

Now navigate to the /client directory and ```npm install``` and ```npm start``` to start the dev server for the front end.
