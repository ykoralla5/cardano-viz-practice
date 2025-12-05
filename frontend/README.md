# Frontend directory

## Structure

`index.html`: Entry point of the Vite application. All components are added to the div with id *root*.  
`/src/App.jsx`: For basic page structure and page routing  
`/src/index.css`: CSS file to define any styling for the theme. Note that this project uses TailwindCSS  
`/src/main.jsx`: Used to define where to mount the React components on the `index.html` page.  

### Folders
`/src/api`: JS functions to make API calls to backend  
`/src/assets`: contains images used on the tool  
`/src/components`: reusable React components  
`/src/pages`: Web pages on the tool. Currently only /home, /explorer and /about are used  
`/src/utils`: JS utility functions for translations such as transaction slot to timestamp  

### Configurations
`package.json`: Modules and their versions for the frontend  
`vite.config.js`: Config file used by Vite
