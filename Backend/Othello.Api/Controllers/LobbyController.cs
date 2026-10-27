using Microsoft.AspNetCore.Mvc;
using Othello.Api.Common;
using Othello.Api.Dtos;
using Othello.Api.Services;

namespace Othello.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LobbyController(ILobbyService lobbyService) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<GetLobbyDetailsDto>> GetPublicLobbies()
    {
        var result = lobbyService.GetPublicLobbies();
        return result.ToActionResult();
    }

    [HttpGet("{id:int}")]
    public ActionResult<GetLobbyDetailsDto> GetLobbyById(int id)
    {
        var result = lobbyService.GetLobbyById(id);
        return result.ToActionResult();
    }

    [HttpGet("player/{playerName}")]
    public ActionResult<GetLobbyDetailsDto> GetLobbyByPlayerName(string playerName)
    {
        var result = lobbyService.GetLobbyByPlayerName(playerName);
        return result.ToActionResult();
    }
}
