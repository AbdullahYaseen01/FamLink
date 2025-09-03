
import Sec1 from "../subComponents/sec1"
import Sec3 from "../subComponents/sec3"
import Sec4 from "../subComponents/sec4"
import img7 from '../../assets/images/img7.png'
import ns5 from '../../assets/images/ns5.png'
import ns6 from '../../assets/images/ns6.png'
import ns7 from '../../assets/images/ns7.png'
import ns8 from '../../assets/images/ns8.png'
import st1 from '../../assets/images/step9.png'
import st2 from '../../assets/images/step13.png'
import st3 from '../../assets/images/step14.png'
import st4 from '../../assets/images/step15.png'
import WorkStep from "../subComponents/worksStep"
import BenefitsSection from "../subComponents/benefitsOfNannySharing"
import FrequentAskQuestion from "../subComponents/frequentAskQues"
import GetStarted from "../subComponents/getStarted"
import { AnimatedWrapper } from "../subComponents/animation"
import { NavLink } from "react-router-dom"
import ComingSoon from "../subComponents/comingSoon"

export default function ListYourBusiness() {
    const benefits = [
        {
            icon: ns5,
            title: 'Increased Visibility',
            description: 'Reach a larger audience of families seeking your services.',
        },
        {
            icon: ns6,
            title: 'Targeted Marketing',
            description: 'Connect with families specifically looking for your expertise.',
        },
        {
            icon: ns7,
            title: 'Community Engagement',
            description: 'Join a network of trusted service providers and engage with the Famlink community.',
        },
        {
            icon: ns8,
            title: 'Easy Management',
            description: 'Effortlessly manage your profile, listings, and customer interactions from one platform.',
        },
    ];

    const step1 = [
        { title: "Step 1", description: "Create an account and access our suite of services.", head: "Sign Up", img: st1 },
        { title: "Step 2", description: "Add detailed information about your services, pricing, and availability.", head: "Create Your Listing", img: st2 },
        { title: "Step 3", description: "Communicate directly with interested families to discuss their needs.", head: "Connect with Families", img: st3 },
        { title: "Step 4", description: "Expand your client base and build your reputation through positive reviews and referrals.", head: "Grow Your Business", img: st4 }
    ];

    const faq = [
        {
            question: 'I own a childcare-related business. How can Famlink help me?',
            answer: 'Whether you run a daycare, a tutoring center, or an after-school program, Famlink helps you connect with families searching for your services. You can create a business profile, list your services, and even hire staff through our job board.'
        },
        {
            question: 'Can I post job listings for my business?',
            answer: 'Yes! Businesses can post job listings for positions like childcare providers, private instructors, or administrative staff.'
        },
        {
            question: 'How does Famlink help businesses get discovered?',
            answer: 'Business listings appear in family searches based on location and service needs. Premium businesses also receive priority placement and additional marketing tools. '
        }
    ]
    return (
        <div className="relative pb-12" style={{
            background: 'linear-gradient(176.74deg, #E7F1DC -21.31%, rgba(254, 250, 224, 0.612) 49.24%, rgba(255, 255, 255, 0.2) 124.15%)'
        }}>
            <div className="padd-res">
                <Sec1 head={"Expand Your Reach with Famlink"} preHead={"List your business and connect with families seeking quality services"} pic={img7} />
    
                <div className="bg-white">
                    <Sec4 subHead={
                        <>
                            Join <NavLink to={'/joinNow'} className="cursor-pointer text-blue-600 transition-colors duration-300 hover:text-blue-400">Famlink,</NavLink> and showcase your business to families in need of your services. Whether you offer tutoring, sports coaching, music lessons, or specialized care, our platform connects you with a wide audience looking for quality and reliable providers.
                        </>
                    } />
                </div>
    
                <div className="bg-white  mt-12 py-12 px-1">
                    <BenefitsSection head={"Benefits of Listing Your Business"} benefits={benefits} />
                </div>
    
                <div className="bg-white mt-12 py-12">
                    <WorkStep head={"How It Works"} subHead={"How to List Your Business"} steps={step1} />
                </div>
    
                <div className="bg-white  mt-12 py-12 px-1">
                    <AnimatedWrapper
                        animationConfig={{
                            from: { opacity: 0, y: -100 },
                            to: { opacity: 1, y: 0, duration: 2.5, ease: "power3.out" },
                        }}
                    >
                        <Sec3 third={true} />
                    </AnimatedWrapper>
                </div>
    
                <div className="bg-white  mt-12 py-12 px-1">
                    <FrequentAskQuestion faq={faq} />
                </div>
    
                <div className="bg-white px-12 py-12 mt-12 justify-center items-center text-center">
                    <GetStarted head={"Get Started"} subHead={"Connect With Families & Grow Your Business"} />
                </div>
            </div>
    
            {/* Mild Coming Soon Overlay */}
            {/* <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 backdrop-blur-md z-30">
                <ComingSoon bg={true} />
            </div> */}
        </div>
    )
    
}