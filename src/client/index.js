process.setFdLimit(8192);

const { app, BrowserWindow } = require('electron');
let window;

if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname);
}

function createWindow() {
    window = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Dashboard-er',
        frame: !(process.env.NODE_ENV !== 'development'),
        fullscreen: (process.env.NODE_ENV !== 'development'),
    });

    window.loadFile(__dirname + '/app/index.htm');

    if (process.env.NODE_ENV === 'development') {
        window.webContents.openDevTools();
    }

    window.on('closed', () => {
        window = null;
    });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    app.quit();
});
app.on('activate', () => {
    if (window === null) {
        createWindow();
    }
});