import { Children, useCallback, useEffect, useRef, useState, useMemo } from "react"
import Header from "../components/Header"

/* Direct container of the bubble map */
export default function Home({ }) {
    return (
        <main className="bg-white dark:bg-gray-900 dark:text-gray-900">
            <section className="h-[90vh] m-0">
                <div className="relative isolate px-6 pt-14 lg:px-8">
                    <div className="mx-auto max-w-2xl py-32 sm:py-10 lg:py-5">
                        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                            <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20">
                                Our inspiration is the user making informed decisions.
                                {' '}
                                <a href="/explorer" className="font-semibold text-indigo-400">
                                    <span aria-hidden="true" className="absolute inset-0" />
                                    Explore <span aria-hidden="true">&rarr;</span>
                                </a>
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-4xl font-semibold tracking-tight text-balance text-white sm:text-6xl">
                                Data to enrich your delegation decisions
                            </h1>
                            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
                                Play around with our interactive bubble map to explore the Cardano
                                ecosystem. Visualize stake pools, their performance, and other key
                                metrics to make informed delegation choices.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <a
                                    href="/explorer"
                                    className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                >
                                    Get started
                                </a>
                                <a href="/about" className="text-sm/6 font-semibold text-white">
                                    Learn more <span aria-hidden="true">→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}