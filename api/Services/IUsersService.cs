using System.Collections.Generic;
using System.Threading.Tasks;
using Pta.Api.Models;

namespace Pta.Api.Services
{
    public interface IUsersService
    {
        Task<IEnumerable<User>> GetUsersAsync();
    }
}
