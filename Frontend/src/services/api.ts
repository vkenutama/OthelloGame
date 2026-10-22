import { GetLobbyDetailsDto } from "../dtos/lobby_dto"

const base_url = "http://localhost:5057"

const getLobby = async (): Promise<GetLobbyDetailsDto[] | null> => {
    try {
        const response = await fetch(`${base_url}/api/lobby`);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();
        console.log(data)

        return data

    } catch (err) {
        console.error('Network or parsing error:', err);
    }

    return null
} 

export{
    getLobby
}