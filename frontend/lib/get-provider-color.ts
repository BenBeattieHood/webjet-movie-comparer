const colors = {
    CinemaWorld: "bg-red-600 text-white",
    FilmWorld: "bg-blue-600 text-white"
}
export const getProviderColor = (provider: string) => {
    return (colors as any)[provider] ?? "bg-gray-600 text-white"
}