import '@styles/index.css';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppStateProvider } from './contexts/AppContext';
import { registerSW } from 'virtual:pwa-register';

const root = ReactDOM.createRoot(document.getElementById('root') || document.body);

root.render(<AppStateProvider>
    <App/>
</AppStateProvider>);

if ('serviceWorker' in navigator) {
    // && !/localhost/.test(window.location)) {
    registerSW();
}