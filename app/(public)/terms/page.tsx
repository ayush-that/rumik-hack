import { getMetaTags } from "@/lib/seo"
/*
MODIFY THIS PROMPT AND COPY PASTE THIS FILE INTO CHATGPT TO GET A FULL TERMS OF SERVICE PAGE

STEPS
- go to https://chat.com
- copy paste this WHOLE file with your details filled in
- remove comments like this one // Your website link (e.g. https://example.com)
- it will return the file with jsx code
- paste it into this file

You are an expert lawyer.

Write a simple, clear, and professional Terms of Service for my website using the details below. Add the current date. Do not explain anything. Output only the final JSX.

Website: [YOUR_WEBSITE_URL]  
// Your website link (e.g. https://example.com)

Name: [YOUR_BUSINESS_NAME]  
// Your product, company, or app name

Contact: [YOUR_CONTACT_EMAIL]  
// Email users can reach you at

Description: [WHAT_YOUR_PRODUCT_OR_SERVICE_DOES]  
// Short explanation of what your service/app does

Accounts: [DO_USERS_HAVE_ACCOUNTS + RESPONSIBILITIES]  
// Mention if users create accounts and what they are responsible for

Payments: [PAYMENT_DETAILS + PROVIDER + REFUND_POLICY]  
// Include payment method (Stripe, Razorpay, etc.) and refund rules

User Content: [WHO_OWNS_USER_CONTENT_IF_ANY]  
// Clarify if users own their uploaded content

Ownership: [WHO_OWNS_PLATFORM_CONTENT_CODE_BRANDING]  
// Usually: you own the platform, code, and branding

Prohibited Use: [RESTRICTIONS LIKE ABUSE HACKING ILLEGAL USE ETC]  
// List what users are NOT allowed to do

Liability: [WARRANTY + LIABILITY DISCLAIMER]  
// Typically "as-is", no guarantees, limited liability

Termination: [ACCOUNT_TERMINATION_RULES]  
// When and why you can suspend/ban users

Governing Law: [COUNTRY_OR_REGION]  
// Legal jurisdiction (e.g. India, US, EU)

RETURN THE JSX ONLY WITH META TAGS ABOVE, NOTHING ELSE
*/

export const metadata = getMetaTags({
    title: "Terms of Service",
    canonicalUrlRelative: "/terms",
})

export default function TermsPage() {
    return (
        <div>
            terms
        </div>
    )
}