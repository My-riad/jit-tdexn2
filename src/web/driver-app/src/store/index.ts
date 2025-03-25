import {
  createStore,
  applyMiddleware,
  compose,
  Store,
  Middleware,
} from 'redux'; // redux ^4.2.0
import thunk, { ThunkMiddleware } from 'redux-thunk'; // redux-thunk ^2.4.2
import {
  persistStore,
  persistReducer,
  Persistor,
} from 'redux-persist'; // redux-persist ^6.0.0
import AsyncStorage from '@react-native-async-storage/async-storage'; // @react-native-async-storage/async-storage ^1.17.11
import { createNetworkMiddleware } from 'react-native-offline'; // react-native-offline ^6.0.0

import rootReducer, { RootState } from './reducers/rootReducer';
import { logger } from '../../common/utils';

/**
 * @function configureStore
 * @description Configures and creates the Redux store with middleware and enhancers
 * @returns {object} The configured Redux store
 */
function configureStore(): { store: Store<RootState>; persistor: Persistor } {
  // LD1: Create Redux persistence configuration
  const persistConfig = {
    key: 'root', // Key for the root of the persisted state
    storage: AsyncStorage, // Storage engine to use (AsyncStorage for React Native)
    whitelist: ['auth', 'profile'], // Array of reducers to persist
    blacklist: ['map', 'load', 'earnings', 'notification'], // Array of reducers not to persist
    version: 1, // Version of the schema
  };

  // LD1: Create persisted reducer using the root reducer and persistence config
  const persistedReducer = persistReducer(persistConfig, rootReducer);

  // LD1: Create network middleware for offline support
  const networkMiddleware = createNetworkMiddleware();

  // LD1: Create middleware array with thunk and network middleware
  const middleware: Middleware[] = [
    thunk as ThunkMiddleware<RootState, any>, // Type assertion needed for thunk
    networkMiddleware,
  ];

  // LD1: Add logger middleware in development environment
  if (process.env.NODE_ENV === 'development') {
    middleware.push(store => next => action => {
      logger.info(`Dispatching ${String(action.type)}`, { action });
      const result = next(action);
      logger.info('Next State', { state: store.getState() });
      return result;
    });
  }

  // LD1: Configure Redux DevTools Extension if available
  const composeEnhancers =
    (window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] as typeof compose) || compose;

  // LD1: Create store enhancer by composing middleware and DevTools
  const enhancer = composeEnhancers(applyMiddleware(...middleware));

  // LD1: Create the Redux store with persisted reducer and enhancers
  const store: Store<RootState> = createStore(persistedReducer, enhancer);

  // LD1: Return the configured store
  const persistor: Persistor = persistStore(store);
  return { store, persistor };
}

// IE3: Export the configured store for use in the application
const { store, persistor } = configureStore();
export { store, persistor };

// IE3: Re-export the root state interface for type definitions
export type { RootState };