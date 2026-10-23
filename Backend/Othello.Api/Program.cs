using System.Collections.Concurrent;
using Othello.Api.Endpoints;
using Othello.Api.Hubs;
using Othello.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddSwaggerGen();

builder.Services.AddSignalR();

const string corsPolicyName = "OthelloClient";

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddSingleton<ConcurrentDictionary<int, Lobby>>();

var app = builder.Build();

// Configure the HTTP request pipeline.
// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
// }

app.UseCors(corsPolicyName);

// Map the SignalR hub endpoint URL
app.MapHub<OthelloHub>("/othello/hub");
app.MapLobbyEndpoint();


app.UseHttpsRedirection();

app.Run();