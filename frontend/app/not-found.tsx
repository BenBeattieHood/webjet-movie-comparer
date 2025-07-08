import Link from "next/link"
import { ArrowLeft, Film } from "lucide-react"
import { Button } from "@/components/generic/button"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Film className="h-12 w-12 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Movie Not Found</h1>
                    <p className="text-muted-foreground">The movie you're looking for doesn't exist or has been removed.</p>
                </div>

                <Link href="/">
                    <Button className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Movies
                    </Button>
                </Link>
            </div>
        </div>
    )
}
