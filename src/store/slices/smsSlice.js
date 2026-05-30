import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    stats: [],
    activities: [],
    workspaces: [],
    numbers: [],
    loading: false,
    error: null,
    search: {
        results: [],
        loading: false,
        error: null
    },
    rent: {
        loading: false,
        error: null,
        result: null
    },
    edit: {
        loading: false,
        error: null,
        result: null
    },
    quota: {
        boardsCount: 0,
        maxBoards: 0
    }
};

const smsSlice = createSlice({
    name: 'sms',
    initialState,
    reducers: {
        fetchDashboardDataStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchDashboardDataSuccess: (state, action) => {
            const { overview, numbers, messages } = action.payload;
            const data = overview || {};

            state.stats = [
                { label: 'Active Numbers', value: data.activeNumbers || 0, trend: 'up', trendValue: 'Total' },
                { label: 'Received SMS', value: data.totalMessages || data.smsCount || 0, trend: 'up', trendValue: 'Total' },
                { label: 'Connected Boards', value: data.connectedWorkspaces || data.boardsCount || 0, trend: 'up', trendValue: 'Boards' },
                { label: 'Response Rate', value: `${data.responseRate || 0}%`, trend: 'up', trendValue: 'Inbound' },
            ];

            state.quota = {
                boardsCount: data.boardsCount || data.activeNumbers || 0,
                maxBoards: data.maxBoards || 0,
                smsCount: data.smsCount || data.totalMessages || 0,
                maxSms: data.maxSms || 0,
                itemsCount: data.itemsCount || 0,
                maxItems: data.maxItems || 0,
                activeNumbers: data.activeNumbers || 0,
            };

            const recipeList = Array.isArray(numbers) ? numbers : [];
            state.numbers = recipeList.map(r => ({
                id: r._id,
                name: r.numberId?.customName || r.name || 'Untitled',
                number: r.numberId?.boardNumber || '',
                desc: r.integration || r.numberId?.provider || 'App Provider',
                country: r.countryCode === 'US' ? 'United States' : (r.countryCode || 'Other'),
                flag: r.countryCode === 'US' ? '🇺🇸' : '🌐',
                status: r.isActive ? 'active' : 'paused',
                toggle: r.isActive,
                workspaceId: r.numberId?.workspaceId || r.workspaceId,
                boardId: r.boardId,
                senderNumberColumnId: r.senderNumberColumnId,
                smsBodyColumnId: r.smsBodyColumnId,
                dateTimeColumnId: r.dateTimeColumnId,
                messages: 0,
            }));

            const activityList = Array.isArray(messages) ? messages : [];
            state.activities = activityList.map(a => ({
                name: a.sender || 'Unknown',
                time: new Date(a.receivedAt || a.createdAt || a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                msg: a.body,
                icon: (a.sender || 'U').substring(0, 2).toUpperCase(),
                result: a.addedToBoard ? 'created' : (a.failedReason ? 'failed' : a.status),
            }));

            state.loading = false;
        },
        fetchDashboardDataFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        updateNumberStatus: (state, action) => {
            const { id, toggle } = action.payload;
            const number = state.numbers.find(n => n.id === id);
            if (number) {
                // Optimistically update number status
                number.toggle = toggle;
                number.status = toggle ? 'active' : 'paused';

                // Optimistically update Active Numbers count in stats
                const activeStat = state.stats.find(s => s.label === 'Active Numbers');
                if (activeStat) {
                    activeStat.value = state.numbers.filter(n => n.toggle).length;
                }
            }
        },
        searchNumbersStart: (state) => {
            state.search.loading = true;
            state.search.error = null;
            state.search.results = [];
        },
        searchNumbersSuccess: (state, action) => {
            state.search.loading = false;
            state.search.results = action.payload;
        },
        searchNumbersFailure: (state, action) => {
            state.search.loading = false;
            state.search.error = action.payload;
        },
        rentNumberStart: (state) => {
            state.rent.loading = true;
            state.rent.error = null;
            state.rent.result = null;
        },
        rentNumberSuccess: (state, action) => {
            state.rent.loading = false;
            state.rent.result = action.payload;
        },
        rentNumberFailure: (state, action) => {
            state.rent.loading = false;
            state.rent.error = action.payload;
        },
        resetRentState: (state) => {
            state.rent.loading = false;
            state.rent.error = null;
            state.rent.result = null;
        },
        editNumberStart: (state) => {
            state.edit.loading = true;
            state.edit.error = null;
            state.edit.result = null;
        },
        editNumberSuccess: (state, action) => {
            state.edit.loading = false;
            state.edit.result = action.payload;

            const { recipe, number } = action.payload;
            if (recipe && recipe._id) {
                const index = state.numbers.findIndex(n => n.id === recipe._id);
                if (index !== -1) {
                    state.numbers[index] = {
                        ...state.numbers[index],
                        name: number?.customName || recipe.numberId?.customName || state.numbers[index].name,
                        workspaceId: number?.workspaceId || recipe.numberId?.workspaceId || state.numbers[index].workspaceId,
                        boardId: recipe.boardId || number?.boardId || state.numbers[index].boardId,
                        senderNumberColumnId: recipe.senderNumberColumnId,
                        smsBodyColumnId: recipe.smsBodyColumnId,
                        dateTimeColumnId: recipe.dateTimeColumnId
                    };

                    if (number) {
                        state.numbers[index].number = number.boardNumber || state.numbers[index].number;
                        state.numbers[index].toggle = number.isActive ?? recipe.isActive ?? state.numbers[index].toggle;
                    } else if (recipe.numberId && typeof recipe.numberId === 'object') {
                        state.numbers[index].number = recipe.numberId.boardNumber || state.numbers[index].number;
                    }

                    if (recipe.isActive !== undefined) {
                        state.numbers[index].toggle = recipe.isActive;
                        state.numbers[index].status = recipe.isActive ? 'active' : 'paused';
                    }
                }
            }
        },
        editNumberFailure: (state, action) => {
            state.edit.loading = false;
            state.edit.error = action.payload;
        },
        resetEditState: (state) => {
            state.edit.loading = false;
            state.edit.error = null;
            state.edit.result = null;
        }
    },
});

export const {
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
    resetRentState,
    editNumberStart,
    editNumberSuccess,
    editNumberFailure,
    resetEditState
} = smsSlice.actions;
export const selectSearchResults = (state) => state.sms.search.results;
export const selectSearchLoading = (state) => state.sms.search.loading;
export const selectSearchError = (state) => state.sms.search.error;
export const selectRentLoading = (state) => state.sms.rent.loading;
export const selectRentError = (state) => state.sms.rent.error;
export const selectRentResult = (state) => state.sms.rent.result;
export const selectEditLoading = (state) => state.sms.edit.loading;
export const selectEditError = (state) => state.sms.edit.error;
export const selectEditResult = (state) => state.sms.edit.result;
export const selectQuota = (state) => state.sms.quota;
export default smsSlice.reducer;
