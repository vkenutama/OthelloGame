using Othello.Api.Common;
using Othello.Api.Dtos;

namespace Othello.Api.Services;

public interface ILobbyService
{
    ServiceResult<List<GetLobbyDetailsDto>> GetPublicLobbies();
    ServiceResult<GetLobbyDetailsDto> GetLobbyById(int id);
    ServiceResult<GetLobbyDetailsDto> GetLobbyByPlayerName(string playerName);
}
