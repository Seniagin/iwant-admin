import { searchCategory } from "../service/categories.api.service";
import { MainLayout } from "./styles"


export const SearchForm = () => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const searchValue = formData.get('search') as string;
        console.log('Search value:', searchValue);
        handleSearch(searchValue);
    }

    const handleSearch = async (search: string) => {
        const result = await searchCategory(search);
        console.log(result);
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="search" placeholder="Your Search" />
            <button type="submit">Search</button>
        </form >
    )
}
