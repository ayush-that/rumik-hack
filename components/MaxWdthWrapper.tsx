import React from 'react'

const MaxWidthWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <main className="max-w-7xl mx-auto w-full">{children}</main>
    )
}

export default MaxWidthWrapper