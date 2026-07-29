import express from 'express'
import Auth from './Auth.js'
import UserData from './userData.js'
import Favourite from './favourite.js'
import Edit from './edit.js'
import Update from './Update.js'
import Payment from './payment.js'
import BookHire from './bookHire.js'
import Review from './reviews.js'
import Location from './location.js'
import Chat from './chat.js'
import Message from './message.js'
import Blog from './blogs.js'
import Community from './community.js'
import AdminUser from './adminUser.js'
import Verification from './verification.js'
import NannyShare from './nannyShare.js'
import PostJob from './postJob.js'
import Subscription from './subscription.js'
import Feedback from './feedback.js'
import Revenue from './revenue.js'
import SMSVerification from './SMSVerification.js'
import EmailVerification from './EmailVerification.js'
import onboardingRoutes from './onboarding.routes.js'
import nannyRoutes from './nanny.routes.js'
import shareRoutes from './share.routes.js'
import matchRoutes from './match.routes.js'
import referralRoutes from './referral.routes.js'
import Debug from './debug.js'
import Unsubscribe from './unsubscribe.js'
import leadRoutes from './lead.routes.js'
import resourceLeadRoutes from './resourceLead.routes.js'
import onboardingLeadRoutes from './onboardingLead.routes.js'

import Waitlist from './waitlist.js'
import PhantombusterRoutes from './phantombuster.routes.js'

const router = express.Router()

router.use('/auth', Auth)
router.use('/userData', UserData)
router.use('/favourite', Favourite)
router.use('/edit', Edit)
router.use('/nannyShare', NannyShare)
router.use('/postJob', PostJob)
router.use('/reviews', Review)
router.use('/location', Location)
router.use('/update', Update)
router.use('/book-hire', BookHire)
router.use('/payment/stripe', Payment)
router.use('/chats', Chat)
router.use('/message', Message)
router.use('/blogs', Blog)
router.use('/community', Community)
router.use('/adminUser', AdminUser)
router.use('/verify', Verification)
router.use('/subscribe', Subscription)
router.use('/feedback', Feedback);
router.use('/revenue', Revenue)
router.use('/sms-verification', SMSVerification)
router.use('/email-verification', EmailVerification)
router.use("/onboarding", onboardingRoutes);
router.use("/nanny", nannyRoutes);
router.use("/share", shareRoutes);
router.use("/match", matchRoutes);
router.use("/referral", referralRoutes);
router.use("/debug", Debug);
router.use("/unsubscribe", Unsubscribe);
router.use("/leads", leadRoutes);
router.use("/resource-leads", resourceLeadRoutes);
router.use("/onboarding-leads", onboardingLeadRoutes);

router.use("/waitlist", Waitlist);
router.use("/phantombuster", PhantombusterRoutes);


export default router   