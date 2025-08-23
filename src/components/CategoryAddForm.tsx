import { MainLayout } from "./styles"


export const CategoryAdd = () => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Form submitted');
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Category" />
            <button type="submit">Add</button>
        </form >
    )
}
