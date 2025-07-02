import React from "react";

export const ErrorBanner: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {children}
        </div>
    );
}