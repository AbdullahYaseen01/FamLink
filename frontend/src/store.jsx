import { configureStore } from '@reduxjs/toolkit'
import additionalServicesSlice from './Components/Redux/setAddtional'
import setFamilyExp from './Components/Redux/setFamilyExp'
import formSlice from './Components/Redux/formValue'
import authSlice from './Components/Redux/authSlice'
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import nannyListSlice from './Components/Redux/nannyData'
import favouriteSlice from './Components/Redux/favouriteSlice'
import cardSlice from './Components/Redux/cardSlice'
import updateSlice from './Components/Redux/updateSlice'
import bookHireSlice from './Components/Redux/bookHireSlice'
import familyListSlice from './Components/Redux/familyData'
import reqDataSlice from './Components/Redux/requestedData'
import fetchOtherReqSlice from './Components/Redux/fetchOtherReq'
import requesterDataSlice from './Components/Redux/acceptedRequsterData'
import comReqDataSlice from './Components/Redux/completedRequestData'
import cancelReqDataSlice from './Components/Redux/cancelRequsterData'
import withdrawDataSlice from './Components/Redux/getWithdrawRequestData'
import reviewData from './Components/Redux/review'
import chatSLice from './Components/Redux/chatSlice'
import blogSlice from './Components/Redux/blogsSlice'
import communitySlice from './Components/Redux/communitySlice'
import selectedContactSlice from './Components/Redux/selectedContactSlice'
import notificationSlice from './Components/Redux/notificationSlice'
import forgetPassSlice from './Components/Redux/forgetPassword'
import postNannyShareSlice from './Components/Redux/nannyShareSlice'
import jobPostSlice from './Components/Redux/postJobSlice'
import smsSlice from './Components/Redux/smsSlice'
import emailSlice from './Components/Redux/emailSlice'
import matchSlice from './Components/Redux/matchSlice'
import referralSlice from './Components/Redux/referralSlice'

const authPersistConfig = {
  key: "auth",
  storage,
  stateReconciler: autoMergeLevel2,
  blacklist: ["isLoading"], // Optionally, you may not want to persist loading state
  whitelist: ["user", "accessToken", "refreshToken", "accessTokenExpiry", "refreshTokenExpiry"], // Only persist these
};

export const store = configureStore({
  reducer: {
    email: emailSlice,
    sms: smsSlice,
    additionalSer: additionalServicesSlice,
    familyExp: setFamilyExp,
    form: formSlice,
    auth: persistReducer(authPersistConfig, authSlice),
    nannyData: nannyListSlice,
    favouriteData: favouriteSlice,
    cardData: cardSlice,
    update: updateSlice,
    bookHire: bookHireSlice,
    familyData: familyListSlice,
    reqData: reqDataSlice,
    otherReqData: fetchOtherReqSlice,
    acceptRequesterData: requesterDataSlice,
    completeRequesterData: comReqDataSlice,
    cancelReqData: cancelReqDataSlice,
    withdrawData: withdrawDataSlice,
    reviews: reviewData,
    matchRequest: matchSlice,
    referral: referralSlice,
    chat: chatSLice,
    blogs: blogSlice,
    community: communitySlice,
    selectedContact: selectedContactSlice,
    notifications: notificationSlice,
    postNannyShare: postNannyShareSlice,
    jobPost: jobPostSlice,
    forgetPassSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export const persistor = persistStore(store);