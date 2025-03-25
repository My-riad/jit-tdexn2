# src/web/shipper-portal/src/store/sagas/rootSaga.ts
```typescript
import { all, fork } from 'redux-saga/effects'; // version ^1.1.3
import watchAuth from './authSaga'; // Import the authentication saga watcher
import watchLoads from './loadSaga'; // Import the load management saga watcher
import watchTracking from './trackingSaga'; // Import the tracking saga watcher
import watchCarriers from './carrierSaga'; // Import the carrier management saga watcher
import watchAnalytics from './analyticsSaga'; // Import the analytics saga watcher
import watchSettings from './settingsSaga'; // Import the settings saga watcher
import watchNotifications from './notificationSaga'; // Import the notification saga watcher

/**
 * Root saga that combines all individual saga watchers and serves as the entry point for Redux-Saga middleware
 */
function* rootSaga(): Generator {
  // Yield all to combine multiple fork effects
  yield all([
    // Fork watchAuth saga to handle authentication-related side effects
    fork(watchAuth),

    // Fork watchLoads saga to handle load management side effects
    fork(watchLoads),

    // Fork watchTracking saga to handle tracking-related side effects
    fork(watchTracking),

    // Fork watchCarriers saga to handle carrier management side effects
    fork(watchCarriers),

    // Fork watchAnalytics saga to handle analytics-related side effects
    fork(watchAnalytics),

    // Fork watchSettings saga to handle settings-related side effects
    fork(watchSettings),

    // Fork watchNotifications saga to handle notification-related side effects
    fork(watchNotifications),
  ]);
}

// Export the root saga as the default export for use in the Redux store configuration
export default rootSaga;