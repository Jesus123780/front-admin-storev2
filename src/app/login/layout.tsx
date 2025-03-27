export default function EmptyLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='es'>
            <body>
                {children}
            </body>
        </html>
    )
}