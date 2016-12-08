using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Pta.Api.Models;
using Pta.Api.Services;

namespace Pta.Api.Controllers
{
    [Route("api/[controller]")]
    public class UsersController : Controller
    {
        private readonly IUsersService _service;

        public UsersController(IUsersService service)
        {
            _service = service;
        }

        [HttpGet("")]
        public Task<IEnumerable<User>> Get()
        {
            return _service.GetUsersAsync();
        }
    }
}
