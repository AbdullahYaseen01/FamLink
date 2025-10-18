import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import MyToastContainer from './toastContainer.jsx'
import './index.css'
import { store, persistor } from './store.jsx'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react';
import { SocketProvider } from './Config/socketProvider.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;


createRoot(document.getElementById('root')).render(
     <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <SocketProvider>
                <App />
                <MyToastContainer />
            </SocketProvider>
        </PersistGate>
    </Provider>
    </GoogleOAuthProvider>

)