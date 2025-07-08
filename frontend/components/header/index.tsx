"use client"

import { Moon, Sun, TrendingUpDown, ArrowLeft } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/generic/button"
import Link from "next/link"
import React from "react"

interface HeaderProps {
    backHref?: string;
    backLabel?: string,
}

export const Header: React.FC<React.PropsWithChildren<HeaderProps>> = ({ children, backHref, backLabel = "Back" }) => {
    const { theme, setTheme } = useTheme()
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
            <div className="container flex h-16 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg" style={{ background: 'linear-gradient(90deg, #d53369 0%, #daae51 100%)' }}>
                        <TrendingUpDown className="h-4 w-4 text-primary-foreground fill-current" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">WebJet Movie Comparer</h1>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="max-w-sm" />

                    {children}

                    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {backHref && (
                        <Link href={backHref}>
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                {backLabel}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}