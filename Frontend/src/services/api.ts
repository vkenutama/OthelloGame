import { GetLobbyDetailsDto } from "../dtos/lobby_dto";

const base_url = "";

const getLobbies = async (): Promise<GetLobbyDetailsDto[] | null> => {
    try {
        const response = await fetch(`${base_url}/api/lobby`);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Network or parsing error:', err);
    }

    return null;
};

const getLobbyByPlayerUsername = async (playerName: string): Promise<GetLobbyDetailsDto | null> => {
    try {
        const response = await fetch(`${base_url}/api/lobby/player/${playerName}`);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const getLobbyById = async (id: number): Promise<GetLobbyDetailsDto | null> => {
    try {
        const response = await fetch(`${base_url}/api/lobby/${id}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
};

export {
    getLobbies as getLobby,
    getLobbyByPlayerUsername,
    getLobbyById
};
