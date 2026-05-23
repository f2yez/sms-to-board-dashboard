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
        const boardId = context?.boardId;
        const objectView = isObjectView(context);
        const config = { headers: authHeaders(token, context) };

        const requests = [
            call(axios.get, `${API_BASE}/api/usage`, config),
            objectView
                ? call(axios.get, `${API_BASE}/api/account/recipes`, config)
                : boardId
                    ? call(axios.get, `${API_BASE}/api/boards/${boardId}/recipes`, config)
                    : call(() => Promise.resolve({ data: [] })),
            objectView
                ? call(axios.get, `${API_BASE}/api/account/activity?limit=10`, config)
                : boardId
                    ? call(axios.get, `${API_BASE}/api/boards/${boardId}/activity?limit=10`, config)
                    : call(() => Promise.resolve({ data: { activity: [] } })),
        ];

        const [usageRes, recipesRes, activityRes] = yield all(requests);

        yield put(fetchDashboardDataSuccess({
            usage: usageRes.data,
            recipes: Array.isArray(recipesRes.data) ? recipesRes.data : [],
            activity: activityRes.data?.activity || [],
        }));

        yield put(fetchWorkspacesStart());
    } catch (error) {
        console.error('Fetch Dashboard Data Error:', error);
        yield put(fetchDashboardDataFailure(error.message));
    }
}

function* updateNumberStatusSaga(action) {
    try {
        const { id, toggle, boardId } = action.payload;
        const token = yield select(selectMondayToken);
        const context = yield select(selectMondayContext);
        const resolvedBoardId = boardId || context?.boardId;
        const config = { headers: authHeaders(token, context) };

        yield call(
            axios.put,
            `${API_BASE}/api/boards/${resolvedBoardId}/recipes/${id}`,
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
            `${API_BASE}/api/numbers/search`,
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
            `${API_BASE}/api/numbers/rent`,
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

        const { id, boardId, ...data } = action.payload;
        const resolvedBoardId = boardId || context?.boardId;

        const response = yield call(
            axios.put,
            `${API_BASE}/api/boards/${resolvedBoardId}/recipes/${id}`,
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
