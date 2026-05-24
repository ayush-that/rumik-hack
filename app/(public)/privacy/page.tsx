import { getMetaTags } from "@/lib/seo"

/*
MODIFY THIS PROMPT AND COPY PASTE THIS FILE INTO CHATGPT TO GET A FULL PRIVACY POLICY PAGE

STEPS
- go to https://chat.com
- copy paste this WHOLE file with your details filled in
- remove comments like this one // Your website link (e.g. https://example.com)
- it will return the file with jsx code
- paste it into this file


You are an expert lawyer.

Write a simple, clear, and professional Privacy Policy for my website using the details below. Add the current date. Do not explain anything. Output only the final JSX.

Website: [YOUR_WEBSITE_URL]  
// Your website link (e.g. https://example.com)

Name: [YOUR_BUSINESS_NAME]  
// Your product, company, or app name

Contact: [YOUR_CONTACT_EMAIL]  
// Email users can contact you at

Description: [WHAT_YOUR_PRODUCT_OR_SERVICE_DOES]  
// Short explanation of your service

Data Collection: [WHAT_DATA_YOU_COLLECT]  
// e.g. name, email, payment info, IP, cookies, analytics

Accounts: [DO_USERS_CREATE_ACCOUNTS]  
// yes/no + what data is stored in accounts

Payments: [PAYMENT_DETAILS]  
// yes/no + provider (Stripe, Razorpay, etc.)

Third-Party Services: [LIST_EXTERNAL_SERVICES]  
// e.g. Google Analytics, Firebase, AWS, etc.

Cookies: [DO_YOU_USE_COOKIES]  
// yes/no + short details

Children: [CHILDREN_POLICY]  
// whether users under 13/18 are allowed

Data Usage: [HOW_YOU_USE_DATA]  
// e.g. improve service, authentication, analytics

Data Sharing: [DO_YOU_SHARE_DATA]  
// if/how data is shared with third parties

Security: [HOW_YOU_PROTECT_DATA]  
// basic measures like encryption, secure servers

User Rights: [USER_RIGHTS]  
// access, update, delete data (GDPR/general)

Governing Law: [COUNTRY_OR_REGION]  
// e.g. India, US, EU

RETURN THE JSX ONLY WITH META TAGS ABOVE, NOTHING ELSE
*/

export const metadata = getMetaTags({
    title: "Privacy Policy",
    canonicalUrlRelative: "/privacy",
})

export default function PrivacyPage() {
    return (
        <div>
            privacy
        </div>
    )
}