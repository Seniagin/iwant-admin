import { MainLayout } from "./styles"


export const Layout = ({children}: {children: React.ReactNode}) => {
    return (
        <MainLayout>
            {children}
        </MainLayout>
    )
}
