import { configureStore } from '@reduxjs/toolkit'; //  ^1.9.0
import createSagaMiddleware from 'redux-saga'; //  ^1.1.3
import { persistStore, persistReducer } from 'redux-persist'; //  ^6.0.0
import storage from 'redux-persist/lib/storage'; //  ^6.0.0
import rootReducer from './reducers/rootReducer'; // Internal import
import rootSaga from './sagas/rootSaga'; // Internal import
import logger from '../../common/utils/logger'; // Internal import

// Configuration for Redux-Persist
const persistConfig = {
  key: 'shipperPortal', // Key for the root of the persisted state
  storage, // Storage location (localStorage in this case)
  whitelist: ['auth', 'settings'], // List of reducers to persist
  blacklist: [], // List of reducers not to persist
};

// Root reducer wrapped with Redux-Persist
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create Redux-Saga middleware instance
const sagaMiddleware = createSagaMiddleware();

// Configure the Redux store with middleware
export const store = configureStore({
  reducer: persistedReducer, // Use the persisted reducer
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'] // Ignore redux-persist action types
      }
    }).concat(sagaMiddleware) // Add saga middleware
});

// Create Redux-Persist persistor for the store
export const persistor = persistStore(store);

// Run the root saga
sagaMiddleware.run(rootSaga);

// Type definition for the application root state
export type RootState = ReturnType<typeof rootReducer>;

// Type definition for the store dispatch function
export type AppDispatch = typeof store.dispatch;