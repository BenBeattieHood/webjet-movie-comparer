
import { Search } from "lucide-react"

interface EmptyStateProps {
    message?: string
    suggestion?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message = "No movies found", suggestion }) =>
    <div className="text-center py-16">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{message}</h3>
        {suggestion && <p className="text-muted-foreground">{suggestion}</p>}
    </div>