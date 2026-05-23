import { call, put, take, fork, takeLatest } from 'redux-saga/effects';
import mondaySdk from 'monday-sdk-js';
import { eventChannel } from 'redux-saga';
import {
    setMondayContext,
    setMondaySettings,
    setMondayToken,
    setMondayLoading,
    setMondayError,
    setMondayConnected,
    setCheckingConnection,
    checkConnectionStart,
    fetchWorkspacesStart,
    fetchWorkspacesSuccess,
    fetchWorkspacesFailure,
    fetchBoardColumnsStart,
    fetchBoardColumnsSuccess,
    fetchBoardColumnsFailure,
    selectMondayToken
} from '../slices/mondaySlice';
import { select } from 'redux-saga/effects';

const monday = mondaySdk();

function createMondayChannel() {
    return eventChannel(emit => {
        const unsubscribeContext = monday.listen('context', (res) => {
            emit({ type: 'context', payload: res.data });
        });
        const unsubscribeSettings = monday.listen('settings', (res) => {
            emit({ type: 'settings', payload: res.data });
        });

        return () => {
            // monday.listen returns an unsubscribe function that should be called to cleanup
            // However, documentation varies on exact return structure, but usually it returns a function or object with unsubscribe.
            // Based on common usage:
            if (typeof unsubscribeContext === 'function') unsubscribeContext();
            if (typeof unsubscribeSettings === 'function') unsubscribeSettings();
        };
    });
}

function* initMondaySaga() {
    try {
        // Authenticate/Get Token
        const tokenRes = yield call([monday, monday.get], 'sessionToken');
        if (tokenRes && tokenRes.data) {
            // Note: Do NOT call monday.setToken() with the sessionToken.
            // The sessionToken is a JWT for backend verification only.
            // monday.api() uses its own OAuth token automatically when inside the iframe.
            yield put(setMondayToken(tokenRes.data));
        } else {
            // If we can't get a token, it might be running locally without correct env
            console.warn('Could not retrieve session token from Monday SDK');
        }

        // Listen for context and settings
        const mondayChannel = yield call(createMondayChannel);

        while (true) {
            const { type, payload } = yield take(mondayChannel);
            if (type === 'context') {
                yield put(setMondayContext(payload));
            } else if (type === 'settings') {
                yield put(setMondaySettings(payload));
            }
            // We can mark loading as false once we have at least context or token
            yield put(setMondayLoading(false));
        }
    } catch (error) {
        console.error('Monday SDK Initialization Error:', error);
        yield put(setMondayError(error.message));
    }
}

function* fetchWorkspacesSaga() {
    try {
        console.log('Fetching workspaces and boards...');

        let workspacesList = [];
        let boardsList = [];

        // Try fetching workspaces (requires workspaces:read scope)
        try {
            const wsResponse = yield call([monday, monday.api], `query { workspaces { id name } }`);
            if (wsResponse?.data?.workspaces) {
                workspacesList = wsResponse.data.workspaces;
            }
        } catch (e) {
            console.warn('Could not fetch workspaces (may need workspaces:read scope):', e.message);
        }

        // Try fetching boards (requires boards:read scope)
        try {
            const boardsResponse = yield call([monday, monday.api], `query { boards(limit: 500) { id name type workspace_id } }`);
            if (boardsResponse?.data?.boards) {
                // Only include real boards (exclude folders, documents, sub_items_board)
                boardsList = boardsResponse.data.boards.filter(b => b.type === 'board');
            }
        } catch (e) {
            console.warn('Could not fetch boards (may need boards:read scope):', e.message);
        }

        console.log('Workspaces:', workspacesList.length, 'Boards:', boardsList.length);

        // Monday API doesn't return "Main Workspace" in workspaces query.
        // Detect it: if any board has null/undefined workspace_id, it belongs to Main Workspace.
        const hasMainWorkspaceBoards = boardsList.some(b => !b.workspace_id);
        if (hasMainWorkspaceBoards) {
            workspacesList = [{ id: 'main', name: 'Main Workspace' }, ...workspacesList];
        }

        yield put(fetchWorkspacesSuccess({
            workspaces: workspacesList,
            boards: boardsList
        }));
    } catch (error) {
        console.error('Fetch Workspaces Error:', error);
        yield put(fetchWorkspacesFailure(error.message));
    }
}

function* fetchBoardColumnsSaga(action) {
    const boardId = action.payload;
    if (!boardId) return;

    try {
        console.log(`Fetching columns for board ${boardId}...`);
        const query = `query { boards(ids: [${boardId}]) { columns { id title type } } }`;
        const response = yield call([monday, monday.api], query);

        if (response?.data?.boards && response.data.boards[0]) {
            yield put(fetchBoardColumnsSuccess({
                boardId,
                columns: response.data.boards[0].columns
            }));
        } else {
            yield put(fetchBoardColumnsFailure('Board not found or no columns available'));
        }
    } catch (error) {
        console.error('Fetch Board Columns Error:', error);
        yield put(fetchBoardColumnsFailure(error.message));
    }
}



function* checkConnectionSaga() {
    try {
        const token = yield select(selectMondayToken);
        // If token isn't in state yet, we might need to wait or get it from SDK.
        // Assuming initMondaySaga runs first or concurrently and sets it.
        // But better to get it fresh if null.
        let authToken = token;
        if (!authToken) {
            const tokenRes = yield call([monday, monday.get], 'sessionToken');
            authToken = tokenRes?.data;
        }

        if (!authToken) {
            yield put(setCheckingConnection(false));
            return;
        }

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = yield call(fetch, `${API_BASE_URL}/api/monday/auth/status`, {
            headers: { 'Authorization': authToken }
        });

        if (response.ok) {
            const data = yield call([response, 'json']);
            // New backend returns { connected, userId, accountId }
            yield put(setMondayConnected({ isConnected: data.connected ?? data.isConnected, account: data.account || null }));
        } else {
            // If error/401, assume not connected or unknown
            yield put(setMondayConnected(false));
        }
    } catch (error) {
        console.error('Check Connection Error:', error);
        yield put(setMondayConnected(false));
    } finally {
        yield put(setCheckingConnection(false));
    }
}

export function* watchMondaySaga() {
    yield fork(initMondaySaga);
    yield takeLatest(fetchWorkspacesStart.type, fetchWorkspacesSaga);
    yield takeLatest(checkConnectionStart.type, checkConnectionSaga);
    yield takeLatest(fetchBoardColumnsStart.type, fetchBoardColumnsSaga);
}
