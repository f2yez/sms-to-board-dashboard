import { all, takeLatest, put, call, select, race, take } from 'redux-saga/effects';
import {
    fetchDashboardDataStart,
    fetchDashboardDataSuccess,
    fetchDashboardDataFailure,
    updateNumberStatus,
    searchNumbersStart,
    searchNumbersSuccess,
    searchNumbersFailure,
    rentNumberStart,
    rentNumberSuccess,
    rentNumberFailure,
    editNumberStart,
    editNumberSuccess,
    editNumberFailure
} from '../slices/smsSlice';
import { selectMondayToken, selectMondayContext, fetchWorkspacesStart, setMondayToken, setMondayError, setMondayContext } from '../slices/mondaySlice';
import { buildAuthHeaders, dashboardApi } from '../../services/api';

function* waitForToken() {
    let token = yield select(selectMondayToken);
    if (!token) {
        const { failure } = yield race({
            success: take(setMondayToken.type),
            failure: take(setMondayError.type),
        });
        if (failure) throw new Error('Failed to obtain Monday token');
        token = yield select(selectMondayToken);
    }
    return token;
}

function isObjectView(context) {
    return context?.instanceType === 'object_view';
}

function* waitForContext() {
    let context = yield select(selectMondayContext);
    // object_view has no boardId — accept context as soon as it arrives
    if (!context) {
        yield take(setMondayContext.type);
        context = yield select(selectMondayContext);
    }
    // For board contexts, wait until boardId is populated
    if (!isObjectView(context) && !context?.boardId) {
        yield take(setMondayContext.type);
        context = yield select(selectMondayContext);
    }
    return context;
}

function* fetchDashboardDataSaga() {
    try {
        const token = yield call(waitForToken);
        const context = yield call(waitForContext);
        const headers = buildAuthHeaders(token, context);

        const [overview, numbers, messages] = yield all([
            call([dashboardApi, dashboardApi.getOverview], headers),
            call([dashboardApi, dashboardApi.getReservedNumbers], headers),
            call([dashboardApi, dashboardApi.getRecentMessages], headers),
        ]);

        yield put(fetchDashboardDataSuccess({
            overview: overview || {},
            numbers: Array.isArray(numbers) ? numbers : [],
            messages: Array.isArray(messages) ? messages : [],
        }));

        yield put(fetchWorkspacesStart());
    } catch (error) {
        console.error('Fetch Dashboard Data Error:', error);
        yield put(fetchDashboardDataFailure(error.message));
    }
}

function* updateNumberStatusSaga(action) {
    try {
        const { id, toggle } = action.payload;
        const token = yield select(selectMondayToken);
        const context = yield select(selectMondayContext);
        const headers = buildAuthHeaders(token, context);
        yield call([dashboardApi, dashboardApi.updateNumber], headers, id, { isActive: toggle });
    } catch (error) {
        console.error('Failed to update recipe status:', error);
    }
}

function* searchNumbersSaga(action) {
    try {
        const { country, type, pattern, connectionType, apiKey, apiSecret } = action.payload;
        const token = yield select(selectMondayToken);
        const context = yield select(selectMondayContext);
        const headers = buildAuthHeaders(token, context);
        const data = yield call([dashboardApi, dashboardApi.searchAvailableNumbers], headers, { country, type, pattern, connectionType, apiKey, apiSecret });
        yield put(searchNumbersSuccess(data));
    } catch (error) {
        yield put(searchNumbersFailure(
            error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to search numbers'
        ));
    }
}

function* rentNumberSaga(action) {
    try {
        const token = yield select(selectMondayToken);
        const context = yield select(selectMondayContext);
        const headers = buildAuthHeaders(token, context);
        const data = yield call([dashboardApi, dashboardApi.rentNumber], headers, { ...action.payload, boardId: action.payload.boardId || context?.boardId });
        yield put(rentNumberSuccess(data));
        yield put(fetchDashboardDataStart());
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to rent number';
        yield put(rentNumberFailure(message));
    }
}

function* editNumberSaga(action) {
    try {
        const token = yield select(selectMondayToken);
        const context = yield select(selectMondayContext);
        const headers = buildAuthHeaders(token, context);
        const { id, ...data } = action.payload;
        const result = yield call([dashboardApi, dashboardApi.updateNumber], headers, id, data);
        yield put(editNumberSuccess(result));
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update recipe';
        yield put(editNumberFailure(message));
    }
}

export function* watchSmsSagas() {
    yield takeLatest(fetchDashboardDataStart.type, fetchDashboardDataSaga);
    yield takeLatest(updateNumberStatus.type, updateNumberStatusSaga);
    yield takeLatest(searchNumbersStart.type, searchNumbersSaga);
    yield takeLatest(rentNumberStart.type, rentNumberSaga);
    yield takeLatest(editNumberStart.type, editNumberSaga);
}
