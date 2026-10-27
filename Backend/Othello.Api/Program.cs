using System.Collections.Concurrent;
using Othello.Api.Hubs;
using Othello.Api.Models;
using Othello.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();

const string corsPolicyName = "OthelloClient";

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddSingleton<ConcurrentDictionary<int, Lobby>>();
builder.Services.AddSingleton<List<IChat>>();
builder.Services.AddScoped<ILobbyService, LobbyService>();

var app = builder.Build();

app.UseCors(corsPolicyName);

// Map controllers & SignalR hub endpoint
app.MapControllers();
app.MapHub<OthelloHub>("/othello/hub");

app.UseHttpsRedirection();

app.Run();
