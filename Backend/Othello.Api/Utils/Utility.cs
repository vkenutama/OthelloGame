namespace Othello.Api.Utils;

public static class Utility
{
    public static bool CheckPlayerUsernameEquality(string username1, string username2)
    {
        return string.Equals(username1, username2, StringComparison.OrdinalIgnoreCase);
    }
}