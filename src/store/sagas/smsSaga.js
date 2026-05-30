import { all, takeLatest, put, call, select, race, take } from 'redux-saga/effects';
import axios from 'axios';
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

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DASHBOARD_API = `${API_BASE}/api/monday/dashboard`;

function authHeaders(token, context) {
    return {
        Authorization: token ? `Bearer ${token}` : undefined,
        'x-monday-board-id': context?.boardId,
        'x-monday-account-id': context?.user?.accountId,
        'x-monday-workspace-id': context?.workspaceId,
    };
}

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
        const config = { headers: authHeaders(token, context) };

        const requests = [
            call(axios.get, `${DASHBOARD_API}/overview`, config),
            call(axios.get, `${DASHBOARD_API}/numbers`, config),
            call(axios.get, `${DASHBOARD_API}/messages/recent`, config),
        ];

        const [overviewRes, numbersRes, messagesRes] = yield all(requests);

        yield put(fetchDashboardDataSuccess({
            overview: overviewRes.data || {},
            numbers: Array.isArray(numbersRes.data) ? numbersRes.data : [],
            messages: Array.isArray(messagesRes.data) ? messagesRes.data : [],
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
        const config = { headers: authHeaders(token, context) };

        yield call(
            axios.put,
            `${DASHBOARD_API}/numbers/${id}`,
            { isActive: toggle },
            config
        );
    } catch (error) {
        console.error('Failed to update recipe status:', error);
    }
}

function* searchNumbersSaga(action) {
    try {
        const { country, type, pattern, connectionType, apiKey, apiSecret } = action.payload;
        const token = yield select(selectMondayToken);
        const context = yield select(selectMondayContext);
        const config = { headers: authHeaders(token, context) };

        const response = yield call(
            axios.post,
            `${DASHBOARD_API}/providers/search-numbers`,
            { country, type, pattern, connectionType, apiKey, apiSecret },
            config
        );

        yield put(searchNumbersSuccess(response.data));
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
        const config = { headers: authHeaders(token, context) };

        const response = yield call(
            axios.post,
            `${DASHBOARD_API}/numbers/rent`,
            { ...action.payload, boardId: action.payload.boardId || context?.boardId },
            config
        );

        yield put(rentNumberSuccess(response.data));
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
        const config = { headers: authHeaders(token, context) };

        const { id, ...data } = action.payload;

        const response = yield call(
            axios.put,
            `${DASHBOARD_API}/numbers/${id}`,
            data,
            config
        );

        yield put(editNumberSuccess(response.data));
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
