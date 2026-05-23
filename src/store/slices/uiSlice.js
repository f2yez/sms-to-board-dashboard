import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    activeTab: 'reserved',
    showRentModal: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        toggleRentModal: (state, action) => {
            state.showRentModal = action.payload ?? !state.showRentModal;
        },
    },
});

export const { setActiveTab, toggleRentModal } = uiSlice.actions;
export default uiSlice.reducer;
