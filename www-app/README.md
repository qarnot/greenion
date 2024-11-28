# www-app

Frontend application to manage machines and VDI sessions

## Installation

Normally, every dependencies should be installed following monorepo's "Dependencies" section in the README.md file.
In case you have added a new dependency in this subrepo and you want to re-install every dependencies, run `yarn` command.
```bash
yarn
```

Having troubles launching services on MacOS? You can check secion "Cannot find linux arm64 package on macOS?" in monorepo's README.md file.

## How to use

To launch the web app, you must follow monorepo's README.md file "Installation" process.
It allow to install all needed dependencies, and launch all needed services.

If you already have followed these steps, you can launch `npm run debug` from monorepo's root.

For more informations, follow instructions in "Get access token" section in the monorepo's README.md.

## Architecture
```
.
├── public/               # location of every files available from application (config for example)
│    └── config/
├── src/                  # location of source code
│    ├── assets/          # location of every assets of application (logos)
│    ├── components/      # location of vuejs components used in application
│    ├── composables/     # location of vuejs composables used in application
│    ├── pages/           # location of components used as pages of the application (machines et sessions)
│    ├── plugins/         # location of every plugins used (primevue, pinia, logger)
│    ├── services/        # location of every usefull services of the application (API, event emitter)
│    ├── stores/          # location of pinia stores
│    ├── types/           # location of typescript types
│    ├── App.vue          # component used as main container
│    ├── main.ts          # entry file of the application
│    └── style.css        # base css file for application
├── index.html            # main html file
├── components.d.ts       # auto generated file to import PrimeVue's components
├── README.md             # you are here
├── .eslintrc.cjs         # eslint configuration file
├── postcss.config.js     # postcss configuration file (used for tailwind)
├── tailwind.config.js    # tailwind configuration file
├── tsconfig.app.json     # typescript configuration file
├── tsconfig.json         # typescript configuration file
├── tsconfig.node.json    # typescript configuration file
├── vite.config.ts        # vite configuration file
├── Dockerfile            # application's Dockerfile
├── .dockerignore
├── .gitignore
├── package.json
└── yarn.lock
```
