import { all } from 'redux-saga/effects';
import { watchSmsSagas } from './sagas/smsSaga';
import { watchMondaySaga } from './sagas/mondaySaga';

export default function* rootSaga() {
    yield all([
        watchSmsSagas(),
        watchMondaySaga(),
    ]);
}
