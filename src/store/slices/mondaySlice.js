import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    token: null,
    context: null,
    settings: {},
    workspaces: [],
    boards: [],
    loading: true,
    error: null,
    isConnected: null,
    isCheckingConnection: true,
    accountData: null,
    columns: {}, // { [boardId]: [columns] }
    columnsLoading: false,
};

const mondaySlice = createSlice({
    name: 'monday',
    initialState,
    reducers: {
        setMondayToken: (state, action) => {
            state.token = action.payload;
        },
        setMondayContext: (state, action) => {
            state.context = action.payload;
        },
        setMondaySettings: (state, action) => {
            state.settings = action.payload;
        },
        setMondayLoading: (state, action) => {
            state.loading = action.payload;
        },
        setMondayError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        setMondayConnected: (state, action) => {
            state.isConnected = action.payload.isConnected;
            state.accountData = action.payload.account;
        },
        setCheckingConnection: (state, action) => {
            state.isCheckingConnection = action.payload;
        },
        checkConnectionStart: (state) => {
            state.isCheckingConnection = true;
        },
        fetchWorkspacesStart: (state) => {
            state.loading = true;
        },
        fetchWorkspacesSuccess: (state, action) => {
            state.workspaces = action.payload.workspaces;
            state.boards = action.payload.boards;
            state.loading = false;
        },
        fetchWorkspacesFailure: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        fetchBoardColumnsStart: (state) => {
            state.columnsLoading = true;
        },
        fetchBoardColumnsSuccess: (state, action) => {
            const { boardId, columns } = action.payload;
            state.columns[boardId] = columns;
            state.columnsLoading = false;
        },
        fetchBoardColumnsFailure: (state, action) => {
            state.error = action.payload;
            state.columnsLoading = false;
        }
    },
});

export const {
    setMondayToken,
    setMondayContext,
    setMondaySettings,
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
    fetchBoardColumnsFailure
} = mondaySlice.actions;

export const selectMondayToken = (state) => state.monday.token;
export const selectMondayContext = (state) => state.monday.context;
export const selectMondaySettings = (state) => state.monday.settings;
export const selectMondayLoading = (state) => state.monday.loading;
export const selectWorkspaces = (state) => state.monday.workspaces;
export const selectBoards = (state) => state.monday.boards;
export const selectMondayError = (state) => state.monday.error;
export const selectIsConnected = (state) => state.monday.isConnected;
export const selectIsCheckingConnection = (state) => state.monday.isCheckingConnection;
export const selectAccountData = (state) => state.monday.accountData;
export const selectBoardColumns = (state, boardId) => state.monday.columns[boardId] || [];
export const selectColumnsLoading = (state) => state.monday.columnsLoading;

export default mondaySlice.reducer;
