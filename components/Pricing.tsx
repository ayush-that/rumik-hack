import Link from "next/link"

const plans = [
    {
        name: 'Starter',
        price: '$49',
        originalPrice: '$79',
        description: 'For indie hackers ready to launch fast.',
        features: [
            'Next.js 15 App Router boilerplate',
            'Convex database setup',
            'Better Auth integration',
            'Stripe OR Dodo Payments',
            'Email templates with Resend',
            'Google OAuth + Magic Links',
            'Pre-built UI components',
            'SEO-optimized blog setup',
            'Discord community access',
            'Lifetime updates',
        ],
        cta: 'Get Starter',
        href: '#',
        featured: false,
    },
    {
        name: 'Pro',
        price: '$99',
        originalPrice: '$149',
        description: 'For serious founders who want the full stack.',
        features: [
            'Everything in Starter',
            'Advanced Convex queries & mutations',
            'Role-based auth (admin, user tiers)',
            'Team/organization support',
            'Subscription + one-time payments',
            'Webhook handling for payments',
            'AI integration hooks (OpenAI, Claude)',
            'Real-time features with Convex',
            'Analytics dashboard setup',
            'Priority Discord support',
            '$500+ in service credits',
            'Lifetime updates',
        ],
        cta: 'Get Pro',
        href: '#',
        featured: true,
    },
    {
        name: 'All-in Bundle',
        price: '$159',
        originalPrice: '$249',
        description: 'The complete founder toolkit + mentorship.',
        features: [
            'Everything in Pro',
            '1-on-1 launch strategy call',
            'Code review of your first deploy',
            'Custom domain + Vercel Pro tips',
            'Advanced caching & performance',
            'Multi-tenancy architecture',
            'White-label components kit',
            'Terms & Privacy policy templates',
            'Investor pitch deck template',
            '6 months priority support',
            '$1,000+ in exclusive discounts',
            'Private founder community',
            'Lifetime updates',
        ],
        cta: 'Get All-in',
        href: '#',
        featured: false,
    },
];

const techStack = [
    { name: 'Next.js 15', icon: '▲', description: 'App Router, RSC, Server Actions' },
    { name: 'Convex', icon: '◆', description: 'Real-time database & backend' },
    { name: 'Better Auth', icon: '🔐', description: 'Modern auth for modern apps' },
    { name: 'Stripe / Dodo', icon: '💳', description: 'Payments infrastructure' },
    { name: 'Tailwind CSS', icon: '🎨', description: 'Utility-first styling' },
    { name: 'TypeScript', icon: '📘', description: 'Type-safe development' },
];


export default function Pricing() {
    return (
        <>
            <section className="flex flex-col items-center justify-center text-center mb-8 mt-8 py-5">
                <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-bold text-balance mb-4">
                    Get the boilerplate.
                    <br />
                    <span className="text-[#f8721c]">Build your SaaS.</span>
                </h1>
                <p className="text-zinc-400 text-lg sm:text-xl font-medium text-balance tracking-tighter max-w-2xl">
                    One-time payment. Lifetime updates. Build unlimited projects.
                </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative flex flex-col rounded-xl p-6 lg:p-8 ${plan.featured
                            ? 'bg-[#f8721c]/10 border-2 border-[#f8721c]'
                            : 'bg-zinc-900/50 border border-zinc-800'
                            }`}
                    >
                        {/* Recommended Badge */}
                        {plan.featured && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-[#f8721c] text-black text-xs font-semibold px-3 py-1 rounded-full tracking-tight">
                                    Most Popular
                                </span>
                            </div>
                        )}

                        {/* Plan Header */}
                        <div className="mb-4">
                            <h2 className="text-white text-xl font-semibold tracking-tight mb-1">
                                {plan.name}
                            </h2>
                            <p className="text-zinc-400 text-sm">
                                {plan.description}
                            </p>
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <span className="text-zinc-500 text-lg line-through mr-2">{plan.originalPrice}</span>
                            <span className="text-white text-4xl sm:text-5xl font-bold tracking-tighter">
                                {plan.price}
                            </span>
                            <span className="text-zinc-500 text-sm font-medium ml-1">USD</span>
                        </div>

                        {/* CTA Button */}
                        <Link
                            href={plan.href}
                            className={`text-center font-semibold tracking-tight py-3 px-6 rounded-md transition-colors duration-200 mb-8 ${plan.featured
                                ? 'bg-[#f8721c] hover:bg-[#ed7e37] text-black'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                                }`}
                        >
                            {plan.cta}
                        </Link>

                        {/* Features List */}
                        <ul className="flex-1 space-y-3">
                            {plan.features.map((feature, index) => (
                                <li key={`${plan.name}-${index}`} className="flex items-start gap-3">
                                    <svg
                                        className={`w-5 h-5 mt-0.5 shrink-0 ${plan.featured ? 'text-[#f8721c]' : 'text-zinc-500'
                                            }`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-zinc-300 text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>
        </>
    )
}
