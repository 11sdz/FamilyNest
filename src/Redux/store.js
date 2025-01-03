// store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice'; // Make sure this path is correct
import selectedProfileReducer from './selectedProfileSlice'; // Make sure this path is correct

const store = configureStore({
  reducer: {
    user: userReducer, // Assign the user slice to the `user` state key
    selectedProfile: selectedProfileReducer, 
  },
});

export default store;