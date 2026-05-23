import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import smsReducer from './slices/smsSlice';

import mondayReducer from './slices/mondaySlice';

const rootReducer = combineReducers({
    ui: uiReducer,
    sms: smsReducer,
    monday: mondayReducer,
});

export default rootReducer;
