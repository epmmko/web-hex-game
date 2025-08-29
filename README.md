# web-hex-game
Hex-game served on the web with ReactJS / JavaScript

Gamplay with 4X speed.
https://github.com/user-attachments/assets/492f67be-79fe-400a-a537-9f6948050c28 <br/>
Game deployed at https://epmmko.pythonanywhere.com/hex-game

## Steps to use the source code
* If using anaconda, install nodejs via `conda install nodejs`
* Activate the environment that has the nodejs, then create react app from
  * \npm create vite&latest web_hex_game -- --template react`
  * `cd web_hex_game`
  * `npm install`
  * `npm run dev`
  * This should show the default react page
* Update the code inside the `src` folder of the `react` app with the code from this github
* Then, hex-game should show up in the development environment
## Deploy on a web
* run `npm run build` to get the static files to be served
* If using Django-python as the backend, create the static file folder inside the app, for example <br/>
```
myproject/
├── myproject/
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── hex_game/
│   ├── static/
│   │   └── hex_game/
│   │       ├── style.css
│   │       ├── script.js
│   │       └── ... (other static files)
│   ├── templates/
│   │   └── hex_game/
│   │       └── hex_game.html
│   ├── views.py
│   └── ...
└── manage.py
```
Serve the built `.js` and `.css` files as static file.
