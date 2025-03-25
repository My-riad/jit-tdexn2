import { all, fork, call, spawn } from 'redux-saga/effects'; // redux-saga/effects ^1.1.3
import watchAuth from './authSaga';
import watchFleet from './fleetSaga';
import watchDriver from './driverSaga';
import watchLoad from './loadSaga';
import analyticsSagas from './analyticsSaga';
import watchNotification from './notificationSaga';
import watchSettings from './settingsSaga';
import logger from '../../../common/utils/logger';

/**
 * Root saga that combines all individual saga watchers
 * @returns Saga generator function
 */
function* rootSaga() {
  logger.info('Starting root saga');

  // Use all effect to combine and fork all saga watchers:
  yield all([
    fork(watchAuth),
    fork(watchFleet),
    fork(watchDriver),
    fork(watchLoad),
    fork(analyticsSagas),
    fork(watchNotification),
    fork(watchSettings)
  ]);
}

export default rootSaga;