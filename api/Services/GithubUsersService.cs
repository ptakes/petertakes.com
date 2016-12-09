using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using Pta.Api.Models;

namespace Pta.Api.Services
{
    public class GithubUsersService : IUsersService
    {
        private readonly GithubCredentials _credentials;
        private readonly ILogger _logger;

        public GithubUsersService(ILogger<GithubUsersService> logger, IOptions<GithubCredentials> options)
        {
            _credentials = options.Value;
            _logger = logger;
        }

        public async Task<IEnumerable<User>> GetUsersAsync()
        {
            var json = await CallApiAsync("users");
            return JArray.Parse(json).Select(item => new User
            {
                AvatarUrl = (string)item["avatar_url"],
                ContactUrl = (string)item["html_url"],
                Login = (string)item["login"]
            });
        }

        private async Task<string> CallApiAsync(string request)
        {
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
                client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "ASP.NET Core");

                _logger.LogDebug($"Github: {_credentials.Username}:{_credentials.Password}");
                var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_credentials.Username}:{_credentials.Password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                client.BaseAddress = new Uri("https://api.github.com/");

                return await client.GetStringAsync(request);
            }
        }
    }
}

